export type StyleModule<S = {}> = {[id in keyof S]: string}

export const StyleModule: {
  new <S extends {[name: string]: Style}>(spec: S, options?: {generateClasses?: boolean}): StyleModule<{[id in keyof S]: string}>
  mount(root: Document | ShadowRoot | DocumentOrShadowRoot, module: StyleModule | ReadonlyArray<StyleModule>): void
  newName(): string
}

export type Style = {
  [propOrSelector: string]: string | number | Style
}
