// Type shim for esbuild text-loader imports of *.html
declare module '*.html' {
  const content: string;
  export default content;
}
