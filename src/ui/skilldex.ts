module Ui {
    export class Skilldex extends WindowFrame {
        constructor() {
            super("art/intrface/skldxbox.png",
                {
                    x: Config.ui.screenWidth - 185 - 5,
                    y: Config.ui.screenHeight - 368,
                    w: 185,
                    h: 368,
                });

            this.add(new Label(65, 13, "Skilldex"))
                .add(new Label(25, 85, "Lockpick").onClick(this.useSkill(Skills.Lockpick)))
                .add(new Label(25, 300, "Repair").onClick(this.useSkill(Skills.Repair)));
        }

        useSkill(skill: Skills) {
            return () => {
                this.close();
                uiMode = UI_MODE_USE_SKILL;
                skillMode = skill;
                console.log("[UI] Using skill:", skill);
            };
        }
    }
}
