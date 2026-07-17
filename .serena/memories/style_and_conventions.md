# Style and Conventions

## CSS & Design
- Bento-card design style, leveraging purple, orange, and lime accents with Plus Jakarta Sans typography.
- Mobile-first design: components must be fully responsive.
- Do not use Tailwind CSS unless explicitly requested. Use Vanilla CSS (e.g. `src/app/globals.css` or scoped styling).
- Compress all images to WebP with proper crop proportions.

## Code Quality & Architecture
- Use MySQL InnoDB engine.
- Use Eager Loading (`with()`) to prevent N+1 queries.
- Optimize configurations and routing on production.
- Parametrize all SQL queries using Eloquent ORM or raw parameterized query strings.
- Validate inputs on both client and server sides.
