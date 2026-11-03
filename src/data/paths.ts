/** Base-path-aware internal link: href('work/') → '/work/' (or '/<repo>/work/' on a project site). */
export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
