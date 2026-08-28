import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';

@Component({
  selector: 'app-screen-loader',
  standalone: true,
  templateUrl: './screen-loader.component.html',
  styleUrl: './screen-loader.component.scss'
})
export class ScreenLoaderComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private previousOverflow = '';
  private previousPaddingRight = '';

  readonly title = input('Đang xử lý');
  readonly message = input('Vui lòng không đóng hoặc tải lại trang.');

  ngOnInit(): void {
    const body = this.document.body;
    const viewportWidth = this.document.defaultView?.innerWidth ?? this.document.documentElement.clientWidth;
    const scrollbarWidth = viewportWidth - this.document.documentElement.clientWidth;

    this.previousOverflow = body.style.overflow;
    this.previousPaddingRight = body.style.paddingRight;
    body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  ngOnDestroy(): void {
    const body = this.document.body;
    body.style.overflow = this.previousOverflow;
    body.style.paddingRight = this.previousPaddingRight;
  }
}
