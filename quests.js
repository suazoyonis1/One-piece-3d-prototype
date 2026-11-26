
import * as THREE from 'three';
import { Enemy } from './entities.js';

export class QuestManager {
  constructor(scene, world, player, ship, npcs, enemies) {
    Object.assign(this,{scene,world,player,ship,npcs,enemies,step:0,crates:0,crew:['Luffy'],spawned:false});
    this.quests = [
      {title:'Chapter 1: A Quiet Day in Foosha',objective:'Talk to Mayor Woop Slap [F].',waypoint:new THREE.Vector3(6,2.3,12)},
      {title:'Chapter 1: Village Supplies',objective:'Collect the 3 supply crates around Foosha Village.',waypoint:new THREE.Vector3(14,2.8,6)},
      {title:'Chapter 1: Trouble in the Hills',objective:'Find Curly Dadan near the Mount Colubo trail.',waypoint:new THREE.Vector3(34,2,-150)},
      {title:'Chapter 1: Gray Terminal',objective:'Defeat the 3 bandits threatening the settlement.',waypoint:new THREE.Vector3(-132,2,-105)},
      {title:'Chapter 1: Brothers',objective:'Find Ace in the Mount Colubo forest.',waypoint:new THREE.Vector3(12,2,-185)},
      {title:'Chapter 1: Set Sail',objective:'Return to Foosha and board the ship at the southern dock [F].',waypoint:new THREE.Vector3(5,1, -38)},
      {title:'East Blue: Shells Town',objective:'Sail southeast and defeat Captain Morgan!',waypoint:new THREE.Vector3(240,2.25,198)},
      {title:'East Blue: Recruit Zoro',objective:'Talk to Roronoa Zoro [F].',waypoint:new THREE.Vector3(228,2.25,217)},
      {title:'East Blue: Baratie',objective:'Sail southwest to Baratie and speak to Sanji.',waypoint:new THREE.Vector3(-230,4,244)},
      {title:'East Blue: Defend Baratie',objective:'Defeat the invading Krieg Pirates!',waypoint:new THREE.Vector3(-230,4,270)},
      {title:'East Blue Complete!',objective:'The next chapter of the adventure awaits.',waypoint:new THREE.Vector3(0,0,0)}
    ];
    this.updateUI();
  }
  showBanner(t) {
    const b=document.getElementById('banner-alert');
    if(!b)return;
    b.textContent=t;b.classList.remove('hidden');
    setTimeout(()=>b.classList.add('hidden'),3000);
  }
  onTalkToNPC(npc) {
    if(npc.id==='mayor' && this.step===0){this.step=1;this.updateUI();}
    else if(npc.id==='dadan' && this.step===2){
      this.step=3;
      if(!this.spawned){
        this.spawned=true;
        const spots=[[-132,2,-105],[-122,2,-111],[-143,2,-97]];
        spots.forEach((p,i)=>this.enemies.push(new Enemy(this.scene,{
          id:`gray_bandit_${i}`,name:`Gray Terminal Bandit ${i+1}`,modelType:'pirate',
          hp:55,damage:8,speed:6.5,position:new THREE.Vector3(...p)
        })));
      }
      this.showBanner('Gray Terminal bandits have appeared!');this.updateUI();
    }
    else if(npc.id==='ace' && this.step===4){this.step=5;this.showBanner('Chapter 1 complete — the sea is calling!');this.updateUI();}
    else if(npc.id==='nami'){this.ship.chartBonus=18;this.showBanner('Ship Speed Upgraded!');}
    else if(npc.id==='zoro' && this.step===7){this.crew.push('Zoro');this.player.berries+=1500;this.step=8;this.showBanner('Zoro Joined Your Crew!');this.updateUI();}
    else if(npc.id==='sanji'){
      this.player.healFull();this.showBanner('HP & Stamina Restored!');
      if(this.step===9){this.step=10;this.spawned=true;
        [-10,10].forEach((x,i)=>this.enemies.push(new Enemy(this.scene,{
          id:`pirate_${i}`,name:'Krieg Pirate',modelType:'pirate',hp:70,damage:10,speed:8,
          position:new THREE.Vector3(-230+x,4,270)
        })));
        this.updateUI();
      }
    }
  }
  update(pPos,isSailing){
    if(this.step===1){
      this.world.supplyCrates.forEach(c=>{
        if(!c.userData.collected && pPos.distanceTo(c.position)<3.5){
          c.userData.collected=true;c.visible=false;this.crates++;
          if(this.crates>=3){this.step=2;this.updateUI();this.showBanner('Supplies collected — head for Mount Colubo.');}
        }
      });
    }
    if(this.step===3 && this.enemies.filter(e=>e.id.startsWith('gray_bandit_')).length===3 &&
       this.enemies.filter(e=>e.id.startsWith('gray_bandit_')).every(e=>e.dead)){
      this.step=4;this.updateUI();this.showBanner('Gray Terminal is safe. Find Ace in the forest.');
    }
    if(this.step===5 && isSailing){this.step=6;this.updateUI();}
    if(this.step===6 && this.enemies.find(e=>e.id==='morgan')?.dead){this.step=7;this.updateUI();}
    if(this.step===9 && this.enemies.filter(e=>e.id.startsWith('pirate_')).length>0 &&
       this.enemies.filter(e=>e.id.startsWith('pirate_')).every(e=>e.dead)){
      this.step=10;this.crew.push('Sanji');this.updateUI();
    }
    const quest=this.quests[this.step];
    const dist=document.getElementById('quest-distance');
    if(dist && quest)dist.textContent=`Waypoint: ${Math.round(pPos.distanceTo(quest.waypoint))} m`;
    const crew=document.getElementById('crew-text');
    if(crew)crew.textContent=this.crew.join(', ');
  }
  updateUI(){
    const q=this.quests[this.step];
    const title=document.getElementById('quest-title');
    const objective=document.getElementById('quest-objective');
    if(title&&q)title.textContent=q.title;
    if(objective&&q)objective.textContent=q.objective;
  }
}
