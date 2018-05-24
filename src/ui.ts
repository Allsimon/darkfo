/*
Copyright 2014 darkf

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// UI system

// TODO: reduce code duplication, circular references,
//       and general badness/unmaintainability.
// TODO: combat UI on main bar
// TODO: stats/info view in inventory screen
// TODO: fix inventory image size
// TODO: fix style for inventory image amount
// TODO: option for scaling the UI

"use strict";

// TODO: enum this
var UI_MODE_NONE = 0, UI_MODE_DIALOGUE = 1, UI_MODE_BARTER = 2, UI_MODE_LOOT = 3,
    UI_MODE_INVENTORY = 4, UI_MODE_WORLDMAP = 5, UI_MODE_ELEVATOR = 6,
    UI_MODE_CALLED_SHOT = 7, UI_MODE_SKILLDEX = 8, UI_MODE_USE_SKILL = 9,
    UI_MODE_CONTEXT_MENU = 10, UI_MODE_SAVELOAD = 11, UI_MODE_CHAR = 12;
var uiMode: number = UI_MODE_NONE;

function $id(id: string): HTMLElement {
    return document.getElementById(id);
}

function $img(id: string): HTMLImageElement {
    return document.getElementById(id) as HTMLImageElement;
}

function $q(selector: string): HTMLElement {
    return document.querySelector(selector);
}

function $qa(selector: string): HTMLElement[] {
    return Array.from(document.querySelectorAll(selector));
}

function clearEl($el: HTMLElement): void {
    $el.innerHTML = "";
}

function show($el: HTMLElement): void {
    $el.style.display = "block";
}

function hide($el: HTMLElement): void {
    $el.style.display = "none";
}

// TODO: Examine if we actually need visibility or we can replace them all with show/hide
function showv($el: HTMLElement): void {
    $el.style.visibility = "visible";
}

function hidev($el: HTMLElement): void {
    $el.style.visibility = "hidden";
}

function off($el: HTMLElement, events: string): void {
    const eventList = events.split(" ");
    for(const event of eventList)
        (<any>$el)["on" + event] = null;
}

function appendHTML($el: HTMLElement, html: string): void {
    $el.insertAdjacentHTML("beforeend", html);
}

interface ElementOptions {
    id?: string;
    src?: string;
    classes?: string[];
    click?: (e: MouseEvent) => void;
    style?: { [key in keyof CSSStyleDeclaration]?: string };
    children?: HTMLElement[];
    attrs?: { [key: string]: string|number };
}

function makeEl(tag: string, options: ElementOptions): HTMLElement {
    const $el = document.createElement(tag);

    if(options.id !== undefined) $el.id = options.id;
    if(options.src !== undefined) ($el as HTMLImageElement).src = options.src;
    if(options.classes !== undefined) $el.className = options.classes.join(" ");
    if(options.click !== undefined) $el.onclick = options.click;
    if(options.style !== undefined) Object.assign($el.style, options.style);
    if(options.children !== undefined) {
        for(const child of options.children)
            $el.appendChild(child);
    }
    if(options.attrs !== undefined) {
        for(const prop in options.attrs)
            $el.setAttribute(prop, options.attrs[prop] + "");
    }

    return $el;
}

function initUI() {
    Ui.init();

    makeDropTarget($id("inventoryBoxList"), (data: string) => { uiMoveSlot(data, "inventory") });
    makeDropTarget($id("inventoryBoxItem1"), (data: string) => { uiMoveSlot(data, "leftHand") });
    makeDropTarget($id("inventoryBoxItem2"), (data: string) => { uiMoveSlot(data, "rightHand") });

    for(let i = 0; i < 2; i++) {
        for(const $chance of Array.from(document.querySelectorAll("#calledShotBox .calledShotChance")))
            $chance.appendChild(makeEl("div", { classes: ["number"], style: { left: (i*9) + "px" }, id: "digit" + (i+1) }));
    }

    $id("calledShotCancelBtn").onclick = () => { uiCloseCalledShot() };

    /*
    $id("worldmapViewButton").onclick = () => {
        var onAreaMap = ($("#areamap").css("visibility") === "visible")
        if(onAreaMap)
            uiWorldMapWorldView()
        else {
            var currentArea = areaContainingMap(gMap.name)
            if(currentArea)
                uiWorldMapShowArea(currentArea)
            else
                uiWorldMapAreaView()
        }
    }
    */

    $id("inventoryButton").onclick = () => { uiInventoryScreen() };
    $id("inventoryDoneButton").onclick = () => {
        uiMode = UI_MODE_NONE;
        $id("inventoryBox").style.visibility = "hidden";
        uiDrawWeapon()
    };

    $id("lootBoxDoneButton").onclick = () => { uiEndLoot(); };

    $id("attackButtonContainer").onclick = () => {
        if(!Config.engine.doCombat) return;
        if(inCombat) {
            // TODO: targeting reticle for attacks
        }
        else {
            // begin combat
            Combat.start()
        }
    };

    $id("attackButtonContainer").oncontextmenu = () => { // right mouse button (cycle weapon modes)
        let wep = critterGetEquippedWeapon(player);
        if(!wep) return false;
        wep.weapon.cycleMode();
        uiDrawWeapon();
        return false
    };

    $id("endTurnButton").onclick = () => {
        if(inCombat && combat.inPlayerTurn) {
            console.log("[TURN]");
            combat.nextTurn()
        }
    };

    $id("endCombatButton").onclick = () => {
        if(inCombat)
            combat.end()
    };

    $id("endContainer").addEventListener("animationiteration", uiEndCombatAnimationDone);
    $id("endContainer").addEventListener("webkitAnimationIteration", uiEndCombatAnimationDone);

    $id("skilldexButton").onclick = () => { Ui.skilldexWindow.toggle() };

    function makeScrollable($el: HTMLElement, scroll: number=60) {
        $el.onwheel = (e: WheelEvent) => {
            const delta = e.deltaY > 0 ? 1 : -1;
            $el.scrollTop = $el.scrollTop + scroll*delta;
            e.preventDefault();
        };
    }

    makeScrollable($id("inventoryBoxList"));

    makeScrollable($id("barterBoxInventoryLeft"));
    makeScrollable($id("barterBoxInventoryRight"));
    makeScrollable($id("barterBoxLeft"));
    makeScrollable($id("barterBoxRight"));
    makeScrollable($id("lootBoxLeft"));
    makeScrollable($id("lootBoxRight"));
    makeScrollable($id("worldMapLabels"));
    makeScrollable($id("displayLog"));
    makeScrollable($id("dialogueBoxReply"), 30);

    Ui.hpNumber.setMaxAmount(critterGetStat(player, "Max HP"));
    Ui.hpNumber.setAmount(critterGetStat(player, "HP"));
    uiDrawWeapon()
}

function uiHideContextMenu() {
    uiMode = UI_MODE_NONE;
    $id("itemContextMenu").style.visibility = "hidden"
}

function uiContextMenu(obj: Obj, evt: any) {
    uiMode = UI_MODE_CONTEXT_MENU;

    function button(obj: Obj, action: string, onclick: () => void) {
        return makeEl("img", { id: "context_" + action,
            classes: ["itemContextMenuButton"],
            click: () => { onclick(); uiHideContextMenu(); }
        });
    }

    const $menu = $id("itemContextMenu");
    clearEl($menu);
    Object.assign($menu.style, {
        visibility: "visible",
        left: `${evt.clientX}px`,
        top: `${evt.clientY}px`
    });
    const cancelBtn = button(obj, "cancel", () => {
    });
    const lookBtn = button(obj, "look", () => uiLog("You see: " + obj.getDescription()));
    const useBtn = button(obj, "use", () => playerUse()); // TODO: playerUse should take an object
    const talkBtn = button(obj, "talk", () => {
        console.log("talking to " + obj.name);
        Scripting.talk(obj._script, obj)
    });
    const pickupBtn = button(obj, "pickup", () => pickupObject(obj, player));

    $menu.appendChild(cancelBtn);
    $menu.appendChild(lookBtn);
    if(obj._script && obj._script.talk_p_proc !== undefined)
        $menu.appendChild(talkBtn);
    if(canUseObject(obj))
        $menu.appendChild(useBtn);
    $menu.appendChild(pickupBtn)
}

function uiStartCombat() {
    // play end container animation
    Object.assign($id("endContainer").style, {animationPlayState: "running", webkitAnimationPlayState: "running"});
}

function uiEndCombat() {
    // play end container animation
    Object.assign($id("endContainer").style, {animationPlayState: "running", webkitAnimationPlayState: "running"});

    // disable buttons
    hidev($id("endTurnButton"));
    hidev($id("endCombatButton"));
}

function uiEndCombatAnimationDone(this: HTMLElement) {
    Object.assign(this.style, {animationPlayState: "paused", webkitAnimationPlayState: "paused"});

    if(inCombat) {
        // enable buttons
        showv($id("endTurnButton"));
        showv($id("endCombatButton"));
    }
}

function uiDrawWeapon() {
    // draw the active weapon in the interface bar
    const weapon = critterGetEquippedWeapon(player);
    clearEl($id("attackButton"));
    if(weapon === null)
        return;

    if(weapon.weapon.type !== "melee") {
        const $attackButtonWeapon = $id("attackButtonWeapon") as HTMLImageElement;
        $attackButtonWeapon.onload = null;
        $attackButtonWeapon.onload = function(this: HTMLImageElement) {
            if(!this.complete) return;
            Object.assign(this.style, {
                position: "absolute",
                top: "5px",
                left: ($id("attackButton").offsetWidth / 2 - this.width / 2) + "px",
                maxHeight: ($id("attackButton").offsetHeight - 10) + "px"
            });
            this.setAttribute("draggable", "false");
        };
        $attackButtonWeapon.src = weapon.invArt + ".png";
    }

    // draw weapon AP
    const CHAR_W = 10;
    const digit = weapon.weapon.getAPCost(1);
    if(digit === undefined || digit > 9)
        return; // TODO: Weapon AP >9?
    $id("attackButtonAPDigit").style.backgroundPosition = (0 - CHAR_W*digit) + "px";

    // draw weapon type (single, burst, called, punch, ...)
    // TODO: all melee weapons
    const wepTypes: { [wepType: string]: string } = {"melee": "punch", "gun": "single"};
    const type = wepTypes[weapon.weapon.type];
    $img("attackButtonType").src = `art/intrface/${type}.png`;

    // hide or show called shot sigil?
    if(weapon.weapon.mode === "called")
        show($id("attackButtonCalled"));
    else
        hide($id("attackButtonCalled"));
}

// TODO: Rewrite this sanely (and not directly modify the player object's properties...)
function uiMoveSlot(data: string, target: string) {
    const playerUnsafe = player as any;
    let obj = null;

    if(data[0] === "i") {
        if(target === "inventory")
            return; // disallow inventory -> inventory

        const idx = parseInt(data.slice(1));
        console.log("idx: " + idx);
        obj = player.inventory[idx];
        player.inventory.splice(idx, 1) // remove object from inventory
    }
    else {
        obj = playerUnsafe[data];
        playerUnsafe[data] = null // remove object from slot
    }

    console.log("obj: " + obj + " (data: " + data + ", target: " + target + ")");

    if(target === "inventory")
        player.inventory.push(obj);
    else {
        if(playerUnsafe[target] !== undefined && playerUnsafe[target] !== null) {
            // perform a swap
            if(data[0] === "i")
                player.inventory.push(playerUnsafe[target]); // inventory -> slot
            else
                playerUnsafe[data] = playerUnsafe[target] // slot -> slot
        }

        playerUnsafe[target] = obj // move the object over
    }

    uiInventoryScreen()
}

function makeDropTarget($el: HTMLElement, dropCallback: (data: string, e?: DragEvent) => void) {
    $el.ondrop = (e: DragEvent) => {
        const data = e.dataTransfer.getData("text/plain");
        dropCallback(data, e);
        return false
    };
    $el.ondragenter = () => false;
    $el.ondragover =  () => false;
}

function makeDraggable($el: HTMLElement, data: string, endCallback?: () => void) {
    $el.setAttribute("draggable", "true");
    $el.ondragstart = (e: DragEvent) => {
        e.dataTransfer.setData('text/plain', data);
        console.log("start drag")
    };
    $el.ondragend = (e: DragEvent) => {
        if(e.dataTransfer.dropEffect !== "none") {
            //$(this).remove()
            endCallback && endCallback()
        }
    };
}

function uiInventoryScreen() {
    uiMode = UI_MODE_INVENTORY;

    showv($id("inventoryBox"));
    drawInventory($id("inventoryBoxList"), player.inventory, (obj: Obj, e: MouseEvent) => {
        makeItemContextMenu(e, obj, "inventory")
    });

    function drawInventory($el: HTMLElement, objects: Obj[], clickCallback?: (item: Obj, e: MouseEvent) => void) {
        clearEl($el);
        clearEl($id("inventoryBoxItem1"));
        clearEl($id("inventoryBoxItem2"));

        for(let i = 0; i < objects.length; i++) {
            const invObj = objects[i];
            // 90x60 // 70x40
            const img = makeEl("img", { src: invObj.invArt+'.png',
                attrs: { width: 72, height: 60, title: invObj.name },
                click: clickCallback ? (e: MouseEvent) => { clickCallback(invObj, e); } : undefined });
            $el.appendChild(img);
            $el.insertAdjacentHTML("beforeend", "x" + invObj.amount);
            makeDraggable(img, "i" + i, () => { uiInventoryScreen(); });
        }
    }

    function itemAction(obj: Obj, slot: keyof Player, action: "cancel"|"use"|"drop") {
        switch(action) {
            case "cancel": break;
            case "use":
                console.log("using object: " + obj.art);
                useObject(obj, player);
                break;
            case "drop":
                //console.log("todo: drop " + obj.art); break
                console.log("dropping: " + obj.art + " with pid " + obj.pid);
                if(slot !== "inventory") {
                    // add into inventory to drop
                    console.log("moving into inventory first");
                    player.inventory.push(obj);
                    player[slot] = null
                }

                dropObject(player, obj);
                uiInventoryScreen();
                break
        }
    }

    function makeContextButton(obj: Obj, slot: keyof Player, action: "cancel"|"use"|"drop") {
        return makeEl("img", { id: "context_" + action,
            classes: ["itemContextMenuButton"],
            click: () => {
                itemAction(obj, slot, action);
                hidev($id("itemContextMenu"));
            }
        });
    }

    function makeItemContextMenu(e: MouseEvent, obj: Obj, slot: keyof Player) {
        const $menu = $id("itemContextMenu");
        clearEl($menu);
        Object.assign($menu.style, {
            visibility: "visible",
            left: `${e.clientX}px`,
            top: `${e.clientY}px`
        });
        const cancelBtn = makeContextButton(obj, slot, "cancel");
        const useBtn = makeContextButton(obj, slot, "use");
        const dropBtn = makeContextButton(obj, slot, "drop");

        $menu.appendChild(cancelBtn);
        if(canUseObject(obj))
            $menu.appendChild(useBtn);
        $menu.appendChild(dropBtn)
    }

    function drawSlot(slot: keyof Player, slotID: string) {
        const art = player[slot].invArt;
        // 90x60 // 70x40
        const img = makeEl("img", {
            src: art + '.png',
            attrs: {width: 72, height: 60, title: player[slot].name},
            click: (e: MouseEvent) => {
                makeItemContextMenu(e, player[slot], slot);
            }
        });
        makeDraggable(img, slot);

        const $slotEl = $id(slotID);
        clearEl($slotEl);
        $slotEl.appendChild(img);
    }

    if(player.leftHand)
        drawSlot("leftHand", "inventoryBoxItem1");
    if(player.rightHand)
        drawSlot("rightHand", "inventoryBoxItem2")
}

function drawDigits(idPrefix: string, amount: number, maxDigits: number, hasSign: boolean) {
    const CHAR_W = 9, CHAR_NEG = 12;
    const sign = (amount < 0) ? CHAR_NEG : 0;
    if(amount < 0) amount = -amount;
    const digits = amount.toString();
    const firstDigitIdx = (hasSign ? 2 : 1);
    if(hasSign)
        $q(idPrefix+"1").style.backgroundPosition = (0 - CHAR_W*sign) + "px"; // sign
    for(var i = firstDigitIdx; i <= maxDigits-digits.length; i++) // left-fill with zeroes
        $q(idPrefix + i).style.backgroundPosition = "0px";
    for(var i = 0; i < digits.length; i++) {
        const idx = digits.length - 1 - i;
        if(digits[idx] === '-')
            var digit = 12;
        else
            var digit = parseInt(digits[idx]);
        $q(idPrefix + (maxDigits-i)).style.backgroundPosition = (0 - CHAR_W*digit) + "px";
    }
}

// Smoothly transition an element's top property from an origin to a target position over a duration
function uiAnimateBox($el: HTMLElement, origin: number|null, target: number, callback?: () => void): void {
    const style = $el.style;

    // Reset to origin, instantly
    if(origin !== null) {
        style.transition = "none";
        style.top = `${origin}px`;
    }

    // We need to wait for the browser to process the updated CSS position, so we need to wait here
    setTimeout(() => {
        // Set up our transition finished callback if necessary
        if(callback) {
            let listener = () => {
                callback();
                $el.removeEventListener("transitionend", listener);
                listener = null; // Allow listener to be GC'd
            };

            $el.addEventListener("transitionend", listener);
        }

        // Ease into the target position over 1 second
        $el.style.transition = "top 1s ease";
        $el.style.top = `${target}px`;
    }, 1);
}

function uiStartDialogue(force: boolean, target?: Critter) {
    if(uiMode === UI_MODE_BARTER && force !== true)
        return;

    uiMode = UI_MODE_DIALOGUE;
    $id("dialogueContainer").style.visibility = "visible";
    $id("dialogueBox").style.visibility = "visible";
    uiAnimateBox($id("dialogueBox"), 480, 290);

    // center around the dialogue target
    if(!target) return;
    const bbox = objectBoundingBox(target);
    if(bbox !== null) {
        const dc = $id("dialogueContainer");
        // alternatively: dc.offset().left - $(heart.canvas).offset().left
        const dx = (dc.offsetWidth / 2 | 0) + dc.offsetLeft;
        const dy = (dc.offsetHeight / 4 | 0) + dc.offsetTop - (bbox.h / 2 | 0);
        cameraX = bbox.x - dx;
        cameraY = bbox.y - dy
    }
}

function uiEndDialogue() {
    // TODO: Transition the dialogue box down?
    uiMode = UI_MODE_NONE;

    $id("dialogueContainer").style.visibility = "hidden";
    $id("dialogueBox").style.visibility = "hidden";
    $id("dialogueBoxReply").innerHTML = "";
}

function uiSetDialogueReply(reply: string) {
    const $dialogueBoxReply = $id("dialogueBoxReply");
    $dialogueBoxReply.innerHTML = reply;
    $dialogueBoxReply.scrollTop = 0;

    $id("dialogueBoxTextArea").innerHTML = "";
}

function uiAddDialogueOption(msg: string, optionID: number) {
    $id("dialogueBoxTextArea").insertAdjacentHTML("beforeend",
        `<li><a href="javascript:dialogueReply(${optionID})">${msg}</a></li>`);
}

function uiGetAmount(item: Obj) {
    while(true) {
        let amount: any = prompt("How many?");
        if(amount === null)
            return 0;
        else if(amount === "")
            return item.amount; // all of it!
        else amount = parseInt(amount);

        if(isNaN(amount) || item.amount < amount)
            alert("Invalid amount");
        else return amount
    }
}

function _uiAddItem(items: Obj[], item: Obj, count: number) {
    for(let i = 0; i < items.length; i++) {
        if(items[i].approxEq(item)) {
            items[i].amount += count;
            return
        }
    }

    // no existing item, add new inventory object
    items.push(item.clone().setAmount(count))
}

function uiSwapItem(a: Obj[], item: Obj, b: Obj[], amount: number) {
    // swap item from a -> b
    if(amount === 0) return;

    let idx = -1;
    for(let i = 0; i < a.length; i++) {
        if(a[i].approxEq(item)) {
            idx = i;
            break
        }
    }
    if(idx === -1)
        throw "item (" + item + ") does not exist in a";

    if(amount < item.amount) // deduct amount from a and give amount to b
        item.amount -= amount;
    else // just swap them
        a.splice(idx, 1);

    // add the item to b
    _uiAddItem(b, item, amount)
}

function uiEndBarterMode() {
    const $barterBox = $id("barterBox");

    uiAnimateBox($barterBox, null, 480, () => {
        hidev($id("barterBox"));
        off($id("barterBoxLeft"), "drop dragenter dragover");
        off($id("barterBoxRight"), "drop dragenter dragover");
        off($id("barterBoxInventoryLeft"), "drop dragenter dragover");
        off($id("barterBoxInventoryRight"), "drop dragenter dragover");
        off($id("barterTalkButton"), "click");
        off($id("barterOfferButton"), "click");

        uiStartDialogue(true) // force dialogue mode
    });
}

function uiBarterMode(merchant: Critter) {
    uiMode = UI_MODE_BARTER;

    // Hide dialogue screen for now (animate down)
    const $dialogueBox = $id("dialogueBox");
    uiAnimateBox($dialogueBox, null, 480, () => {
        $dialogueBox.style.visibility = "hidden";
        console.log("going to pop up barter box");

        // Pop up the bartering screen (animate up)
        const $barterBox = $id("barterBox");
        $barterBox.style.visibility = "visible";
        uiAnimateBox($barterBox, 480, 290);
    });

    // logic + UI for bartering
    // TODO: would it be better if we dropped the "working" copies?

    // a copy of inventories for both parties
    let workingPlayerInventory = player.inventory.map(cloneItem);
    let workingMerchantInventory = merchant.inventory.map(cloneItem);

    // and our working barter tables
    let playerBarterTable: Obj[] = [];
    let merchantBarterTable: Obj[] = [];

    function totalAmount(objects: Obj[]): number {
        let total = 0;
        for(let i = 0; i < objects.length; i++) {
            total += objects[i].pro.extra.cost * objects[i].amount
        }
        return total
    }

    // TODO: checkOffer() or some-such
    function offer() {
        console.log("[OFFER]");

        const merchantOffered = totalAmount(merchantBarterTable);
        const playerOffered = totalAmount(playerBarterTable);
        const diffOffered = playerOffered - merchantOffered;

        if(diffOffered >= 0) {
            // OK, player offered equal to more more than the value
            console.log("[OFFER OK]");

            // finalize and apply the deal

            // swap to working inventories
            merchant.inventory = workingMerchantInventory;
            player.inventory = workingPlayerInventory;

            // add in the table items
            for(var i = 0; i < merchantBarterTable.length; i++)
                player.addInventoryItem(merchantBarterTable[i], merchantBarterTable[i].amount)
            for(var i = 0; i < playerBarterTable.length; i++)
                merchant.addInventoryItem(playerBarterTable[i], playerBarterTable[i].amount)

            // re-clone so we can continue bartering if necessary
            workingPlayerInventory = player.inventory.map(cloneItem);
            workingMerchantInventory = merchant.inventory.map(cloneItem);

            playerBarterTable = [];
            merchantBarterTable = [];

            redrawBarterInventory()
        }
        else {
            console.log("[OFFER REFUSED]")
        }
    }

    function drawInventory($el: HTMLElement, who: "p"|"m"|"l"|"r", objects: Obj[]) {
        clearEl($el);

        for(let i = 0; i < objects.length; i++) {
            const inventoryImage = objects[i].invArt;
            // 90x60 // 70x40
            const img = makeEl("img", {
                src: inventoryImage + '.png',
                attrs: {width: 72, height: 60, title: objects[i].name}
            });
            $el.appendChild(img);
            $el.insertAdjacentHTML("beforeend", "x" + objects[i].amount);
            makeDraggable(img, who + i)
        }
    }

    function uiBarterMove(data: string, where: "left"|"right"|"leftInv"|"rightInv") {
        console.log("barter: move " + data + " to " + where);

        const from = ({
            "p": workingPlayerInventory,
            "m": workingMerchantInventory,
            "l": playerBarterTable,
            "r": merchantBarterTable
        } as any)[data[0]];

        if(from === undefined) throw "uiBarterMove: wrong data: " + data;

        const idx = parseInt(data.slice(1));
        const obj = from[idx];
        if(obj === undefined) throw "uiBarterMove: obj not found in list (" + idx + ")";

        // player inventory -> left table or player inventory
        if(data[0] === "p" && where !== "left" && where !== "leftInv")
            return;

        // merchant inventory -> right table or merchant inventory
        if(data[0] === "m" && where !== "right" && where !== "rightInv")
            return;

        const to = {
            "left": playerBarterTable,
            "right": merchantBarterTable,
            "leftInv": workingPlayerInventory,
            "rightInv": workingMerchantInventory
        }[where];

        if(to === undefined)
            throw "uiBarterMove: invalid location: " + where;
        else if(to === from) // table -> same table
            return;
        else if(obj.amount > 1)
            uiSwapItem(from, obj, to, uiGetAmount(obj));
        else uiSwapItem(from, obj, to, 1);

        redrawBarterInventory()
    }

    // bartering drop targets
    makeDropTarget($id("barterBoxLeft"), (data: string) => { uiBarterMove(data, "left") });
    makeDropTarget($id("barterBoxRight"), (data: string) => { uiBarterMove(data, "right") });
    makeDropTarget($id("barterBoxInventoryLeft"), (data: string) => { uiBarterMove(data, "leftInv") });
    makeDropTarget($id("barterBoxInventoryRight"), (data: string) => { uiBarterMove(data, "rightInv") });

    $id("barterTalkButton").onclick = uiEndBarterMode;
    $id("barterOfferButton").onclick = offer;

    function redrawBarterInventory() {
        drawInventory($id("barterBoxInventoryLeft"), "p", workingPlayerInventory);
        drawInventory($id("barterBoxInventoryRight"), "m", workingMerchantInventory);
        drawInventory($id("barterBoxLeft"), "l", playerBarterTable);
        drawInventory($id("barterBoxRight"), "r", merchantBarterTable);

        const moneyLeft = totalAmount(playerBarterTable);
        const moneyRight = totalAmount(merchantBarterTable);

        $id("barterBoxLeftAmount").innerHTML = "$" + moneyLeft;
        $id("barterBoxRightAmount").innerHTML = "$" + moneyRight;
    }

    redrawBarterInventory()
}

function uiEndLoot() {
    uiMode = UI_MODE_NONE;

    hidev($id("lootBox"));
    off($id("lootBoxLeft"), "drop dragenter dragover");
    off($id("lootBoxRight"), "drop dragenter dragover");
    off($id("lootBoxTakeAllButton"), "click");
}

function uiLoot(object: Obj) {
    uiMode = UI_MODE_LOOT;

    function uiLootMove(data: string /* "l"|"r" */, where: "left"|"right") {
        console.log("loot: move " + data + " to " + where);

        const from = ({
            "l": player.inventory,
            "r": object.inventory
        } as any)[data[0]];

        if(from === undefined) throw "uiLootMove: wrong data: " + data;

        const idx = parseInt(data.slice(1));
        const obj = from[idx];
        if(obj === undefined) throw "uiLootMove: obj not found in list (" + idx + ")";

        const to = {
            "left": player.inventory,
            "right": object.inventory
        }[where];

        if(to === undefined)
            throw "uiLootMove: invalid location: " + where;
        else if(to === from) // object -> same location
            return;
        else if(obj.amount > 1)
            uiSwapItem(from, obj, to, uiGetAmount(obj));
        else uiSwapItem(from, obj, to, 1);

        drawLoot()
    }

    function drawInventory($el: HTMLElement, who: "p"|"m"|"l"|"r", objects: Obj[]) {
        clearEl($el);

        for(let i = 0; i < objects.length; i++) {
            const inventoryImage = objects[i].invArt;
            // 90x60 // 70x40
            const img = makeEl("img", {
                src: inventoryImage + '.png',
                attrs: {width: 72, height: 60, title: objects[i].name}
            });
            $el.appendChild(img);
            $el.insertAdjacentHTML("beforeend", "x" + objects[i].amount);
            makeDraggable(img, who + i);
        }
    }

    console.log("looting...");

    showv($id("lootBox"));

    // loot drop targets
    makeDropTarget($id("lootBoxLeft"), (data: string) => { uiLootMove(data, "left") });
    makeDropTarget($id("lootBoxRight"), (data: string) => { uiLootMove(data, "right") });

    $id("lootBoxTakeAllButton").onclick = () => {
        console.log("take all...");
        const inv = object.inventory.slice(0); // clone inventory
        for(let i = 0; i < inv.length; i++)
            uiSwapItem(object.inventory, inv[i], player.inventory, inv[i].amount)
        drawLoot()
    };

    function drawLoot() {
        drawInventory($id("lootBoxLeft"), "l", player.inventory);
        drawInventory($id("lootBoxRight"), "r", object.inventory)
    }

    drawLoot()
}

function uiLog(msg: string) {
    const $log = $id("displayLog");
    $log.insertAdjacentHTML("beforeend", `<li>${msg}</li>`);
    $log.scrollTop = $log.scrollHeight;
}

function uiCloseWorldMap() {
    uiMode = UI_MODE_NONE;

    hide($id("worldMapContainer"));
    hidev($id("areamap"));
    hidev($id("worldmap"));

    Worldmap.stop()
}

function uiWorldMap(onAreaMap: boolean=false) {
    uiMode = UI_MODE_WORLDMAP;
    show($id("worldMapContainer"));

    if(!mapAreas)
        mapAreas = loadAreas();

    if(onAreaMap)
        uiWorldMapAreaView();
    else
        uiWorldMapWorldView();
    uiWorldMapLabels()
}

function uiWorldMapAreaView() {
    hidev($id("worldmap"));
    showv($id("areamap"));

    Worldmap.stop()
}

function uiWorldMapWorldView() {
    showv($id("worldmap"));
    hidev($id("areamap"));

    Worldmap.start()
}

function uiWorldMapShowArea(area: Area) {
    uiWorldMapAreaView();

    const $areamap = $id("areamap");
    $areamap.style.backgroundImage = `url('${area.mapArt}.png')`;
    clearEl($areamap);

    for(const entrance of area.entrances) {
        console.log("Area entrance: " + entrance.mapLookupName);
        const $entranceEl = makeEl("div", {classes: ["worldmapEntrance"]});
        const $hotspot = makeEl("div", {classes: ["worldmapEntranceHotspot"]});

        $hotspot.onclick = () => {
            // hotspot click -- travel to relevant map
            const mapName = lookupMapNameFromLookup(entrance.mapLookupName);
            console.log("hotspot -> " + mapName + " (via " +
                entrance.mapLookupName + ")");
            gMap.loadMap(mapName);
            uiCloseWorldMap()
        };

        $entranceEl.appendChild($hotspot);
        appendHTML($entranceEl, entrance.mapLookupName);
        $entranceEl.style.left = entrance.x + "px";
        $entranceEl.style.top = entrance.y + "px";
        $id("areamap").appendChild($entranceEl);
    }
}

function uiWorldMapLabels() {
    $id("worldMapLabels").innerHTML = "<div id='worldMapLabelsBackground'></div>";

    let i = 0;
    for(const areaID in mapAreas) {
        const area = mapAreas[areaID];
        if(!area.labelArt) continue;

        const label = makeEl("img", {classes: ["worldMapLabelImage"], src: area.labelArt + ".png"});
        const labelButton = makeEl("div", {
            classes: ["worldMapLabelButton"],
            click: () => {
                uiWorldMapShowArea(mapAreas[areaID])
            }
        });

        const areaLabel = makeEl("div", {
            classes: ["worldMapLabel"], style: {top: (1 + i * 27) + "px"},
            children: [label, labelButton]
        });
        $id("worldMapLabels").appendChild(areaLabel);
        i++
    }
}

function uiElevatorDone() {
    uiMode = UI_MODE_NONE;
    hidev($id("elevatorBox"));

    // flip all buttons to hidden
    for(const $elevatorButton of $qa(".elevatorButton")) {
        hidev($elevatorButton);
        $elevatorButton.onclick = null;
    }
    hidev($id("elevatorLabel"));
}

function uiElevator(elevator: Elevator) {
    uiMode = UI_MODE_ELEVATOR;
    const art = lookupInterfaceArt(elevator.type);
    console.log("elevator art: " + art);
    console.log("buttons: " + elevator.buttonCount);

    if(elevator.labels !== -1) {
        const labelArt = lookupInterfaceArt(elevator.labels);
        console.log("elevator label art: " + labelArt);

        const $elevatorLabel = $id("elevatorLabel");
        showv($elevatorLabel);
        $elevatorLabel.style.backgroundImage = `url('${labelArt}.png')`;
    }

    const $elevatorBox = $id("elevatorBox");
    showv($elevatorBox);
    $elevatorBox.style.backgroundImage = `url('${art}.png')`;

    // flip the buttons we need visible
    for(let i = 1; i <= elevator.buttonCount; i++) {
        const $elevatorButton = $id("elevatorButton" + i);
        showv($elevatorButton);
        $elevatorButton.onclick = () => {
            // button `i` pushed
            // todo: animate positioner/spinner (and come up with a better name for that)

            const mapID = elevator.buttons[i - 1].mapID;
            const level = elevator.buttons[i - 1].level;
            const position = fromTileNum(elevator.buttons[i - 1].tileNum);

            if(mapID !== gMap.mapID) {
                // different map
                console.log("elevator -> map " + mapID + ", level " + level + " @ " +
                    position.x + ", " + position.y);
                gMap.loadMapByID(mapID, position, level)
            }
            else if(level !== currentElevation) {
                // same map, different elevation
                console.log("elevator -> level " + level + " @ " +
                    position.x + ", " + position.y);
                player.move(position);
                gMap.changeElevation(level, true)
            }

            // else, same elevation, do nothing
            uiElevatorDone()
        };
    }
}

function uiCloseCalledShot() {
    uiMode = UI_MODE_NONE;
    hide($id("calledShotBox"));
}

function uiCalledShot(art: string, target: Critter, callback?: (regionHit: string) => void) {
    uiMode = UI_MODE_CALLED_SHOT;
    show($id("calledShotBox"));

    function drawChance(region: string) {
        let chance: any = Combat.prototype.getHitChance(player, target, region).hit;
        console.log("id: %s | chance: %d", "#calledShot-"+region+"-chance #digit", chance);
        if(chance <= 0)
            chance = "--";
        drawDigits("#calledShot-"+region+"-chance #digit", chance, 2, false)
    }

    drawChance("torso");
    drawChance("head");
    drawChance("eyes");
    drawChance("groin");
    drawChance("leftArm");
    drawChance("rightArm");
    drawChance("leftLeg");
    drawChance("rightLeg");

    $id("calledShotBackground").style.backgroundImage = `url('${art}.png')`;

    for(const $label of $qa(".calledShotLabel")) {
        $label.onclick = (evt: MouseEvent) => {
            const id = (evt.target as HTMLElement).id;
            const regionHit = id.split("-")[1];
            console.log("clicked a called location (%s)", regionHit);
            if(callback)
                callback(regionHit)
        };
    }
}

function uiSaveLoad(isSave: boolean): void {
    uiMode = UI_MODE_SAVELOAD;

    const saveList = new Ui.List({ x: 55, y: 50, w: "auto", h: "auto" });
    const saveInfo = new Ui.Label(404, 262, "", "#00FF00");
    // TODO: CSSBoundingBox's width and height should be optional (and default to `auto`), then Label can accept one
    Object.assign(saveInfo.elem.style, {
        width: "154px", height: "33px",
        fontSize: "8pt",
        overflow: "hidden",
    });

    const saveLoadWindow = new Ui.WindowFrame("art/intrface/lsgame.png", { x: 80, y: 20, w: 640, h: 480 })
        .add(new Ui.Widget("art/intrface/lscover.png", { x: 340, y: 40, w: 275, h: 173 }))
        .add(new Ui.Label(50, 26, isSave ? "Save Game" : "Load Game"))
        .add(new Ui.SmallButton(391, 349).onClick(selected)).add(new Ui.Label(391+18, 349, "Done"))
        .add(new Ui.SmallButton(495, 349).onClick(done)).add(new Ui.Label(495+18, 349, "Cancel"))
        .add(saveInfo)
        .add(saveList)
        .show();

    if(isSave) {
        saveList.select(saveList.addItem({ text: "<New Slot>", id: -1, onSelected: () => {
                saveInfo.setText("New save");
            } }));
    }

    // List saves, and write them to the UI list
    SaveLoad.saveList((saves: SaveLoad.SaveGame[]) => {
        for(const save of saves) {
            saveList.addItem({ text: save.name, id: save.id, onSelected: () => {
                    saveInfo.setText(SaveLoad.formatSaveDate(save) + "<br>" + save.currentMap);
                } });
        }
    });

    function done() {
        uiMode = UI_MODE_NONE;
        saveLoadWindow.close();
    }

    function selected() { // Done was clicked, so save/load the slot
        const item = saveList.getSelection();
        if(!item) return; // No slot selected

        const saveID = item.id;

        console.log("[UI] %s save #%d.", isSave ? "Saving" : "Loading", saveID);

        if(isSave) {
            const name = prompt("Save Name?");

            if(saveID !== -1) {
                if(!confirm("Are you sure you want to overwrite that save slot?"))
                    return;
            }

            SaveLoad.save(name, saveID === -1 ? undefined : saveID, done);
        }
        else {
            SaveLoad.load(saveID);
            done();
        }
    }
}
