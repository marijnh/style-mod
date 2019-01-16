export function styleModule<S extends {[name: string]: Style}>(spec: S, options?: {priority?: 0 | 1 | 2}): StyleModule<{[id in keyof S]: string}>

export declare namespace styleModule {
  export function mount(root: Document | ShadowRoot | DocumentOrShadowRoot, module: StyleModule): void
}

export type StyleModule<S = any> = {[id in keyof S]: string}

export type Style = {
  [propOrSelector: string]: string | number | Style
}
