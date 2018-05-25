namespace Ui {
  // Container that all of the top-level UI elements reside in
  let $uiContainer: HTMLElement = null as HTMLElement;
  export const PX = "px";
  export let skilldexWindow: WindowFrame | null = null;
  export let characterWindow: CharacterScreen | null = null;
  export let hpNumber: NumberContainer;
  export let acNumber: NumberContainer;
  export let apBar: ApBar;

  export function init() {
    $uiContainer = document.getElementById("game-container");

    skilldexWindow = new Skilldex();
    characterWindow = new CharacterScreen();
    hpNumber = new HpNumber().show();
    acNumber = new AcNumber().show();
    apBar = new ApBar().show();

    // initCharacterScreen();

    document.getElementById("chrButton").onclick = () => {
      characterWindow && characterWindow.close();
      characterWindow.refresh();
    };
  }

  // Bounding box that accepts strings as well as numbers
  export interface CSSBoundingBox {
    x: number | string;
    y: number | string;
    w?: number | string;
    h?: number | string;
  }

  export class WindowFrame {
    children: Widget[] = [];
    elem: HTMLElement;
    showing: boolean = false;

    constructor(
      public background: string,
      public bbox: CSSBoundingBox,
      children?: Widget[]
    ) {
      this.elem = document.createElement("div");

      Object.assign(this.elem.style, {
        position: "absolute",
        left: `${bbox.x}px`,
        top: `${bbox.y}px`,
        width: `${bbox.w}px`,
        height: `${bbox.h}px`
      });
      if (background) {
        this.elem.style.backgroundImage = `url('${background}')`;
      }

      if (children) {
        for (const child of children) this.add(child);
      }
    }

    add(widget: Widget): this {
      this.children.push(widget);
      this.elem.appendChild(widget.elem);
      return this;
    }

    show(): this {
      if (this.showing) return this;
      this.showing = true;
      $uiContainer.appendChild(this.elem);
      return this;
    }

    close(): void {
      if (!this.showing) return;
      this.showing = false;
      this.elem.parentNode.removeChild(this.elem);
    }

    toggle(): this {
      if (this.showing) this.close();
      else this.show();
      return this;
    }
  }

  export class Widget {
    elem: HTMLElement;
    hoverBackground: string | null = null;
    mouseDownBackground: string | null = null;

    constructor(
      public background: string | null,
      public bbox?: CSSBoundingBox
    ) {
      this.elem = document.createElement("div");
      if (bbox) {
        Object.assign(this.elem.style, {
          position: "absolute",
          left: `${bbox.x}px`,
          top: `${bbox.y}px`,
          width: `${bbox.w}px`,
          height: `${bbox.h}px`
        });
      }
      this.setBackgroundUrl(background);
    }

    setBackgroundUrl(background?: string) {
      if (!!background) {
        this.elem.style.backgroundImage = `url('${background}')`;
      } else {
        this.elem.style.backgroundImage = null;
      }
    }

    onClick(fn: (widget?: Widget) => void): this {
      this.elem.onclick = () => fn(this);
      return this;
    }

    hoverBG(background: string): this {
      this.hoverBackground = background;

      if (!this.elem.onmouseenter) {
        // Set up events for hovering/not hovering
        this.elem.onmouseenter = () =>
          this.setBackgroundUrl(this.hoverBackground);
        this.elem.onmouseleave = () => this.setBackgroundUrl(this.background);
      }

      return this;
    }

    mouseDownBG(background: string): this {
      this.mouseDownBackground = background;

      if (!this.elem.onmousedown) {
        // Set up events for mouse down/up
        this.elem.onmousedown = () =>
          this.setBackgroundUrl(this.mouseDownBackground);
        this.elem.onmouseup = () => this.setBackgroundUrl(this.background);
      }

      return this;
    }

    css(props: any): this {
      Object.assign(this.elem.style, props);
      return this;
    }

    toggleVisibility() {
      console.log("I'm a debug method, don't call me ");
      this.elem.style.visibility =
        this.elem.style.visibility === "visible" ? "hidden" : "visible";
    }
  }

  export class SmallButton extends Widget {
    constructor(x: number, y: number) {
      super("art/intrface/lilredup.png", { x, y, w: 15, h: 16 });
      this.mouseDownBG("art/intrface/lilreddn.png");
    }
  }

  export class Label extends Widget {
    constructor(
      x: number,
      y: number,
      text: string,
      public textColor: string = "yellow"
    ) {
      super(null, { x, y, w: "auto", h: "auto" });
      this.setText(text);
      this.elem.style.color = this.textColor;
    }

    setText(text: string): void {
      this.elem.innerHTML = text;
    }
  }

  interface ListItem {
    id?: any; // identifier userdata
    uid?: number; // unique identifier (filled in by List)
    text: string;
    onSelected?: () => void;
  }

  // TODO: disable-selection class
  export class List extends Widget {
    items: ListItem[] = [];
    itemSelected?: (item: ListItem) => void;
    currentlySelected: ListItem | null = null;
    currentlySelectedElem: HTMLElement | null = null;
    _lastUID: number = 0;

    constructor(
      bbox: CSSBoundingBox,
      items?: ListItem[],
      public textColor: string = "#00FF00",
      public selectedTextColor: string = "#FCFC7C"
    ) {
      super(null, bbox);
      this.elem.style.color = this.textColor;

      if (items) {
        for (const item of items) this.addItem(item);
      }
    }

    onItemSelected(fn: (item: ListItem) => void): this {
      this.itemSelected = fn;
      return this;
    }

    getSelection(): ListItem | null {
      return this.currentlySelected;
    }

    // Select the given item (and optionally, give its element for performance reasons)
    select(item: ListItem, itemElem?: HTMLElement): boolean {
      if (!itemElem)
        // Find element belonging to this item
        itemElem = this.elem.querySelector(`[data-uid="${item.uid}"]`);

      if (!itemElem) {
        console.warn(`Can't find item's element for item UID ${item.uid}`);
        return false;
      }

      this.itemSelected && this.itemSelected(item);

      item.onSelected && item.onSelected();

      if (this.currentlySelectedElem)
        // Reset text color for old selection
        this.currentlySelectedElem.style.color = this.textColor;

      // Use selection color for new selection
      itemElem.style.color = this.selectedTextColor;

      this.currentlySelected = item;
      this.currentlySelectedElem = itemElem;

      return true;
    }

    // Select item given by its id
    selectId(id: any): boolean {
      const item = this.items.filter(item => item.id === id)[0];
      if (!item) return false;
      this.select(item);
      return true;
    }

    addItem(item: ListItem): ListItem {
      item.uid = this._lastUID++;
      this.items.push(item);

      const itemElem = document.createElement("div");
      itemElem.style.cursor = "pointer";
      itemElem.textContent = item.text;
      itemElem.setAttribute("data-uid", item.uid + "");
      itemElem.onclick = () => {
        this.select(item, itemElem);
      };
      this.elem.appendChild(itemElem);

      // Select first item added
      if (!this.currentlySelected) this.select(item);

      return item;
    }

    clear(): void {
      this.items.length = 0;

      const node = this.elem;
      while (node.firstChild) node.removeChild(node.firstChild);
    }
  }
}
