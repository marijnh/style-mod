export enum Priority {}

export class StyleModule {
  constructor(classes: {[name: string]: Style});
  mount(root: Document | ShadowRoot | DocumentOrShadowRoot, priority?: Priority): {[name: string]: string};
  static lowPriority: Priority;
  static normalPriority: Priority;
  static highPriority: Priority;
}

export type Style = {
  [propOrSelector: string]: string | number | Style
}
