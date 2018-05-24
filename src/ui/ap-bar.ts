module Ui {
    // TODO: this implementation looks off
    export class ApBar extends WindowFrame {
        // Fallout & Fallout 2 display 10 AP max.
        readonly MAX_AP = 10;

        constructor() {
            super(null, {x: 394, y: 614, w: 114, h: 5});
            this.elem.style.display = 'flex';

            for (let i = 0; i < this.MAX_AP; i++) {
                this.add(new ApIcon());
            }
        }

        setAmount(combatAp: number, moveAp: number, state = State.OUT_OF_COMBAT) {
            for (let i = 0; i < this.MAX_AP; i++) {
                let currentIconState = State.OUT_OF_COMBAT;

                // Todo: reverse engineer this properly
                if (i < combatAp) {
                    currentIconState = state;
                } else if (i < combatAp + moveAp) {
                    currentIconState = State.IN_COMBAT_AP_POINT;
                }

                // During enemy turn, all AP points are red even if the player got only 3 MAX AP points
                if (state === State.IN_COMBAT_ENEMY_TURN) {
                    currentIconState = State.IN_COMBAT_ENEMY_TURN;
                }

                (this.children[i] as ApIcon).setState(currentIconState);
            }
        }
    }

    class ApIcon extends Widget {
        constructor() {
            super(null);
            this.css({flex: '1', backgroundRepeat: 'no-repeat'});
        }

        setState(state: State) {
            this.setBackgroundUrl(state === State.OUT_OF_COMBAT ? null : state);
        }
    }

    export const enum State {
        OUT_OF_COMBAT = '',
        IN_COMBAT = 'art/intrface/hlgrn.png',
        IN_COMBAT_ENEMY_TURN = 'art/intrface/hlred.png',
        IN_COMBAT_AP_POINT = 'art/intrface/hlyel.png'
    }
}
