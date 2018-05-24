module Ui {
    export class CharacterScreen extends WindowFrame {
        private skillList: List;

        constructor() {
            super("art/intrface/edtredt.png",
                {
                    x: Config.ui.screenWidth / 2 - 640 / 2,
                    y: Config.ui.screenHeight / 2 - 480 / 2,
                    w: 640,
                    h: 480,
                });


            this.skillList = new List({x: 380, y: 27, w: "auto", h: "auto"});
            this.skillList.css({fontSize: "0.75em"});


            this
                .add(new SmallButton(455, 454).onClick(() => { }))
                .add(new Label(455 + 18, 454, "Done"))
                .add(new SmallButton(552, 454).onClick(() => this.close()))
                .add(new Label(552 + 18, 454, "Cancel"))
                .add(new Label(22, 6, "Name"))
                .add(new Label(160, 6, "Age"))
                .add(new Label(242, 6, "Gender"))
                .add(new Label(33, 280, `Level: ${critterGetStat(player, "Level")}`)
                    .css({fontSize: "0.75em", color: "#00FF00"}))
                .add(new Label(33, 292, `Exp: ${critterGetStat(player, "Experience")}`)
                    .css({fontSize: "0.75em", color: "#00FF00"}))
                .add(new Label(380, 5, "Skill"))
                .add(new Label(399, 233, "Skill Points"))
                .add(new Label(194, 45, `Hit Points ${critterGetStat(player, "HP")}/${critterGetStat(player, "Max HP")}`)
                    .css({fontSize: "0.75em", color: "#00FF00"}))
                .add(this.skillList);
        }


        refresh() {
            // TODO: Move these constants to their proper place

            const skills = [
                "Small Guns",
                "Big Guns",
                "Energy Weapons",
                "Unarmed",
                "Melee Weapons",
                "Throwing",
                "First Aid",
                "Doctor",
                "Sneak",
                "Lockpick",
                "Steal",
                "Traps",
                "Science",
                "Repair",
                "Speech",
                "Barter",
                "Gambling",
                "Outdoorsman",
            ];

            const stats = [
                "STR",
                "PER",
                "END",
                "CHA",
                "INT",
                "AGI",
                "LUK",
            ];

            // TODO: Use a list of widgets or something for stats instead of this hack
            const statWidgets: Label[] = [];

            let selectedStat = stats[0];

            let n = 0;
            for (const stat of stats) {
                const widget = new Label(20, 39 + n, "").css({background: "black", padding: "5px"});
                widget.onClick(() => {
                    selectedStat = stat;
                });
                statWidgets.push(widget);
                this.add(widget);
                n += 33;
            }

            // TODO: (Re-)run this after window is shown / a level-up is invoked
            const newStatSet = player.stats.clone();
            const newSkillSet = player.skills.clone();

            // Skill Points / Tag Skills counter
            const skillPointCounter = new Label(522, 230, "").css({background: "black", padding: "5px"});
            this.add(skillPointCounter);

            const redrawStatsSkills = () => {
                // Draw skills
                this.skillList.clear(); // TODO: setItemText or something

                for (const skill of skills)
                    this.skillList.addItem({text: `${skill} ${newSkillSet.get(skill, newStatSet)}%`, id: skill});

                // Draw stats
                for (let i = 0; i < stats.length; i++) {
                    const stat = stats[i];
                    statWidgets[i].setText(`${stat} - ${newStatSet.get(stat)}`);
                }

                // Update skill point counter
                skillPointCounter.setText(pad(newSkillSet.skillPoints, 2));
            };

            redrawStatsSkills();

            const isLevelUp = true; // TODO
            const canChangeStats = true; // TODO

            if (isLevelUp) {

                const modifySkill = (inc: boolean) => {
                    const skill = this.skillList.getSelection().id;
                    console.log("skill: %s currently: %d", skill, newSkillSet.get(skill, newStatSet));

                    if (inc) {
                        const changed = newSkillSet.incBase(skill);
                        if (!changed) {
                            console.warn("Not enough skill points!");
                        }
                    }
                    else {
                        newSkillSet.decBase(skill);
                    }

                    redrawStatsSkills();
                };

                const toggleTagSkill = () => {
                    const skill = this.skillList.getSelection().id;
                    const tagged = newSkillSet.isTagged(skill);
                    console.log("skill: %s currently: %d tagged: %s", skill, newSkillSet.get(skill, newStatSet), tagged);

                    if (!tagged)
                        newSkillSet.tag(skill);
                    else
                        newSkillSet.untag(skill);

                    redrawStatsSkills();
                };

                const modifyStat = (change: number) => {
                    console.log("stat: %s currently: %d", selectedStat, newStatSet.get(selectedStat));

                    newStatSet.modifyBase(selectedStat, change);
                    redrawStatsSkills();
                };

                // Skill level up buttons
                this.add(new Label(580, 236, "-").onClick(() => {
                    console.log("-");
                    modifySkill(false);
                }))
                    .add(new Label(600, 236, "+").onClick(() => {
                        console.log("+");
                        modifySkill(true);
                    }))
                    .add(new Label(620, 236, "Tag").onClick(() => {
                        console.log("Tag");
                        toggleTagSkill();
                    }));

                // Stat level up buttons
                if (canChangeStats) {
                    this.add(new Label(115, 260, "-").onClick(() => {
                        console.log("-");
                        modifyStat(-1);
                    }));
                    this.add(new Label(135, 260, "+").onClick(() => {
                        console.log("+");
                        modifyStat(+1);
                    }));
                }
            }

            this.show();
        }
    }
}
