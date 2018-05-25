namespace Ui {
  export class Skilldex extends WindowFrame {
    constructor() {
      super("art/intrface/skldxbox.png", {
        x: Config.ui.screenWidth - 185 - 5,
        y: Config.ui.screenHeight - 368,
        w: 185,
        h: 368
      });

      this.add(new Label(65, 13, "Skilldex"));

      const sortedSkills = [
        Skills.Sneak,
        Skills.Lockpick,
        Skills.Steal,
        Skills.Traps,
        Skills.FirstAid,
        Skills.Doctor,
        Skills.Science,
        Skills.Repair
      ];

      // First skill is at 50 pixels, then 18px top-bottom margin
      let y = 14;
      for (let skill of sortedSkills) {
        y = y + 36;
        this.add(new Label(25, y, skill).onClick(this.useSkill(skill)));
      }
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
