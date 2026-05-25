import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() notificPanel!: { close: () => void };

  private readonly destroy$ = new Subject<void>();

  // Dummy notifications
  notifications = [{
    message: 'New contact added',
    icon: 'assignment_ind',
    time: '1 min ago',
    route: '/inbox',
    color: 'primary'
  }, {
    message: 'New message',
    icon: 'chat',
    time: '4 min ago',
    route: '/chat',
    color: 'accent'
  }, {
    message: 'Server rebooted',
    icon: 'settings_backup_restore',
    time: '12 min ago',
    route: '/charts',
    color: 'warn'
  }]

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((routeChange) => routeChange instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
          this.notificPanel.close();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  clearAll(e: Event) {
    e.preventDefault();
    this.notifications = [];
  }
}
