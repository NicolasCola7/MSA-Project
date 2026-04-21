import { ChangeDetectionStrategy, Component } from '@angular/core';

/** STUB — activate when backend flow is implemented */
@Component({
  selector: 'acme-active-ride',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stub-page">
      <span class="stub-icon">🚧</span>
      <h2>ActiveRide</h2>
      <p class="stub-note">
        Not yet implemented in the backend.<br/>
        Will be activated once the Zeebe workers are ready.
      </p>
    </div>
  `,
  styles: [`
    .stub-page { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; padding:3rem; text-align:center; color:#94a3b8; }
    .stub-icon { font-size:3rem; }
    h2 { color:#38bdf8; font-size:1.2rem; }
    .stub-note { font-size:0.85rem; line-height:1.6; }
  `],
})
export class ActiveRideComponent {}
