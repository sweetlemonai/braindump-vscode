import * as vscode from 'vscode';
import {
  aggregateMentions,
  parseMarkers,
  parseMentions,
  type CalloutKind,
  type Marker,
  type MentionOccurrence,
  type MentionSummary,
} from './parser';

const BD_GLOB = '**/*.bd';
const DIRTY_REINDEX_DEBOUNCE_MS = 250;

interface FileIndex {
  mentions: MentionOccurrence[];
  markers: Marker[];
}

export interface CalloutOccurrence {
  uri: vscode.Uri;
  lineNumber: number;
  level: number;
  content: string;
}

export class WorkspaceIndex implements vscode.Disposable {
  private readonly byUri = new Map<string, FileIndex>();
  private readonly disposables: vscode.Disposable[] = [];
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changeEmitter.event;

  async initialize(): Promise<void> {
    const uris = await vscode.workspace.findFiles(BD_GLOB);
    await Promise.all(uris.map((uri) => this.indexFromDisk(uri, false)));

    // Any .bd editors already open: reflect their in-memory buffers
    // (covers dirty files open before the extension activated).
    for (const doc of vscode.workspace.textDocuments) {
      if (doc.languageId === 'braindump') this.indexFromDocument(doc, false);
    }
    this.changeEmitter.fire();

    const watcher = vscode.workspace.createFileSystemWatcher(BD_GLOB);
    this.disposables.push(
      watcher,
      this.changeEmitter,
      watcher.onDidCreate((uri) => this.indexFromDisk(uri)),
      watcher.onDidChange((uri) => this.indexFromDisk(uri)),
      watcher.onDidDelete((uri) => {
        this.byUri.delete(uri.toString());
        this.changeEmitter.fire();
      }),
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId !== 'braindump') return;
        this.scheduleReindex(e.document);
      }),
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === 'braindump') this.indexFromDocument(doc);
      })
    );
  }

  getAllMentions(): MentionSummary[] {
    return aggregateMentions(
      Array.from(this.byUri.values(), (fi) => fi.mentions)
    );
  }

  getCallouts(kind: CalloutKind, scope?: { uri: vscode.Uri }): CalloutOccurrence[] {
    const results: CalloutOccurrence[] = [];
    const filterUri = scope?.uri.toString();
    for (const [uriStr, fileIndex] of this.byUri) {
      if (filterUri && uriStr !== filterUri) continue;
      for (const marker of fileIndex.markers) {
        if (marker.family === kind) {
          results.push({
            uri: vscode.Uri.parse(uriStr),
            lineNumber: marker.lineNumber,
            level: marker.level,
            content: marker.content,
          });
        }
      }
    }
    results.sort((a, b) => {
      const u = a.uri.toString().localeCompare(b.uri.toString());
      return u !== 0 ? u : a.lineNumber - b.lineNumber;
    });
    return results;
  }

  dispose(): void {
    for (const t of this.debounceTimers.values()) clearTimeout(t);
    this.debounceTimers.clear();
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.byUri.clear();
  }

  private scheduleReindex(doc: vscode.TextDocument): void {
    const key = doc.uri.toString();
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.debounceTimers.delete(key);
        this.indexFromDocument(doc);
      }, DIRTY_REINDEX_DEBOUNCE_MS)
    );
  }

  private indexFromDocument(doc: vscode.TextDocument, fire = true): void {
    const text = doc.getText();
    this.byUri.set(doc.uri.toString(), {
      mentions: parseMentions(text),
      markers: parseMarkers(text),
    });
    if (fire) this.changeEmitter.fire();
  }

  private async indexFromDisk(uri: vscode.Uri, fire = true): Promise<void> {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      const text = new TextDecoder('utf-8').decode(bytes);
      this.byUri.set(uri.toString(), {
        mentions: parseMentions(text),
        markers: parseMarkers(text),
      });
    } catch {
      this.byUri.delete(uri.toString());
    }
    if (fire) this.changeEmitter.fire();
  }
}
