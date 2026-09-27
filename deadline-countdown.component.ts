import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, takeWhile, timer } from 'rxjs';

@Component({
  selector: 'app-deadline-countdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (secondsLeft() !== undefined) {
      Seconds left to deadline: {{ secondsLeft() }}
    }
  `,
})
export class DeadlineCountdownComponent {
  private http = inject(HttpClient);

  secondsLeft = toSignal(
    this.http.get<{ secondsLeft: number }>('/api/deadline').pipe(
      // Fetch once and turn the response into a fixed deadline timestamp.
      map(({ secondsLeft }) => Date.now() + secondsLeft * 1000),
      // Recalculate from the clock each tick instead of decrementing a counter,
      // so the countdown doesn't drift if the timer fires late.
      switchMap((deadline) =>
        timer(0, 1000).pipe(
          map(() => Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
          takeWhile((seconds) => seconds > 0, true),
        ),
      ),
    ),
  );
}
