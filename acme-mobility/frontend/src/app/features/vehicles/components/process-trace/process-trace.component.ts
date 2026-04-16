import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
} from '@angular/core';
import { TraceLog } from '@core/models/trace-log.model';

@Component({
  selector: 'acme-process-trace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="process-panel">
      <h3 class="panel-title">🔄 Trace — Execution Flow</h3>
      <div class="event-log" #logContainer>
        @for (log of logs(); track log.id) {
          <div class="log-item">
            <span class="log-time">{{ log.time }}</span>
            <span [class]="'log-msg log-' + log.level">{{ log.message }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .process-panel {
      background: #0d1117;
      border: 1px solid #1e3a5f;
      border-radius: 10px;
      padding: 1rem 1.2rem;
      font-size: 0.78rem;
      color: #64748b;
    }

    .panel-title {
      color: #38bdf8;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    .event-log {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      max-height: 180px;
      overflow-y: auto;
      scroll-behavior: smooth;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #2d3250; border-radius: 2px; }
    }

    .log-item {
      display: flex;
      gap: 0.6rem;
    }

    .log-time { color: #475569; flex-shrink: 0; }

    .log-info  { color: #38bdf8; }
    .log-ok    { color: #22c55e; }
    .log-warn  { color: #f59e0b; }
    .log-error { color: #ef4444; }
  `],
})
export class ProcessTraceComponent implements AfterViewChecked {
  readonly logs = input.required<TraceLog[]>();

  @ViewChild('logContainer') private logContainer?: ElementRef<HTMLDivElement>;

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const el = this.logContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
