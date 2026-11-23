// Reveal once, only for content below the viewport. Reading never depends on JS.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-ready');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting){entry.target.classList.remove('pending');entry.target.classList.add('visible');observer.unobserve(entry.target);}
  }),{threshold:0.04});
  document.querySelectorAll('.fi').forEach(el => {
    if(el.getBoundingClientRect().top > innerHeight){el.classList.remove('visible');el.classList.add('pending');observer.observe(el);}
  });
}
