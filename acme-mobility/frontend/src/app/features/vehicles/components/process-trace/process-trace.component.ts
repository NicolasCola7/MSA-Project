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
  templateUrl: './process-trace.component.html',
  styleUrl: './process-trace.component.scss',
})
export class ProcessTraceComponent implements AfterViewChecked {
  readonly logs = input.required<TraceLog[]>();

  @ViewChild('logContainer') private logContainer?: ElementRef<HTMLDivElement>;

  ngAfterViewChecked(): void {
    const el = this.logContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
