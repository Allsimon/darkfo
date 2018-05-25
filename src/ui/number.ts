namespace Ui {
  export class NumberContainer extends WindowFrame {
    private amount: number;
    private maxAmount: number;

    constructor(public bbox: CSSBoundingBox, private maxDigit = 4) {
      super(null, NumberContainer.autoBoundingBox(bbox, maxDigit));

      for (let i = 0; i < maxDigit; i++) {
        this.add(new NumberWidget());
      }
      this.elem.style.display = "flex";
    }

    static autoBoundingBox(bbox: CSSBoundingBox, maxDigit: number) {
      if (!bbox.h && !bbox.w) {
        bbox.w =
          (NumberWidget.CHAR_WIDTH + NumberWidget.CHAR_WIDTH_PADDING * 2) *
          maxDigit;
        bbox.h = NumberWidget.CHAR_HEIGHT;
      }
      return bbox;
    }

    setMaxAmount(maxAmount: number) {
      this.maxAmount = maxAmount;
    }

    setAmount(amount: number) {
      this.setAmountAnimated(this.amount, amount, () => (this.amount = amount));
    }

    private setAmountAnimated(
      currentAmount: number,
      targetAmount: number,
      onFinish: () => void
    ) {
      if (currentAmount === targetAmount) {
        onFinish();
        return;
      }
      // Don't animate for the first animation
      const amount =
        currentAmount === undefined
          ? targetAmount
          : (currentAmount < targetAmount ? 1 : -1) + currentAmount;
      const isNegative = amount < 0;

      // If we have the space for 4 digits, we can go from -999 to 9999
      // Todo: when the amount is '13', we currently display '0013', the correct display is ' 013'
      // this is because the 'art/intrface/numbers.png' doesn't have an "empty" symbol
      // -999 === 10^3 - 1
      // 9999 === 10^4 - 1
      const maxAmount =
        Math.pow(10, this.maxDigit + (isNegative ? -1 : -1)) - 1;
      const safeValue = Math.min(Math.abs(amount), maxAmount);

      // If the amount is negative, the UI show the '-' sign first
      // e.g. => -13 with 4 MAX digits is '-013'
      const safeAmount = this.leftPadNegative(safeValue, isNegative);

      // todo: reverse engineer properly what causes the numbers goes from white to yellow to red
      let gravity;
      if (isNegative || safeValue < 0.25 * this.maxAmount) {
        gravity = Gravity.DANGER;
      } else if (safeValue < 0.5 * this.maxAmount) {
        gravity = Gravity.WARN;
      } else {
        gravity = Gravity.NA;
      }
      for (let i = 0; i < this.maxDigit; i++) {
        // todo: `-` sign seems to be 7 px wide ? :/
        this.children[i].css({
          backgroundPositionX:
            this.computeBackgroundPosition(i, safeAmount, gravity) + PX
        });
      }

      // todo: find the correct value, is it even linear ?
      const ANIMATION_DURATION = 32;
      setTimeout(
        () => this.setAmountAnimated(amount, targetAmount, onFinish),
        ANIMATION_DURATION
      );
    }

    leftPadNegative(value: number, isNegative: boolean) {
      const stringMaxSize = this.maxDigit + (isNegative ? -1 : 0);
      const leftPadded = new Array(this.maxDigit)
        .concat([value])
        .join("0")
        .slice(-stringMaxSize);
      return (isNegative ? "-" : "") + leftPadded;
    }

    computeBackgroundPosition(
      index: number,
      amount: string,
      gravity = Gravity.NA
    ): number {
      const digit =
        amount[index] === "-" ? NumberWidget.CHAR_NEG : +amount[index];
      return -NumberWidget.CHAR_WIDTH * digit + gravity;
    }
  }

  class NumberWidget extends Widget {
    static readonly CHAR_WIDTH = 9;
    static readonly CHAR_WIDTH_PADDING = 1;
    static readonly CHAR_HEIGHT = 17;
    static readonly CHAR_NEG = 12;

    constructor() {
      super("art/intrface/numbers.png");
      this.css({ flex: "1", height: "17px" });
    }
  }

  const enum Gravity {
    NA = 0,
    WARN = -119,
    DANGER = -239
  }
}
