export class StyleModule {
  constructor(spec: {[selector: string]: StyleSpec},
              options?: {process(sel: string): string, extend(template: string, sel: string): string})
  static mount(root: Document | ShadowRoot | DocumentOrShadowRoot, module: StyleModule | ReadonlyArray<StyleModule>): void
  static newName(): string
}

export type StyleSpec = {
  [propOrSelector: string]: string | number | StyleSpec
}
