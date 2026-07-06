import { memo } from "react";

function formatDate(date: Date): string {
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${month} 月 ${day} 日 · ${weekday}`;
}

function Header() {
  const today = new Date();

  return (
    <header className="mb-8 animate-fade-slide-in">
      <p className="mb-2 font-sans text-xs uppercase tracking-[0.25em] text-ink-muted">
        {formatDate(today)}
      </p>
      <h1 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
        今日待办
      </h1>
      <div className="mt-3 h-px w-16 bg-terracotta" />
    </header>
  );
}

export default memo(Header);
