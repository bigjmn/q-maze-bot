var partsetter = 'space'
var partimage = ''
$('.panelpart').on('click', function(){
  $('.panelpart').css('border-color','black');
  $(this).css('border-color','blue');
  partsetter = this.id
  partimage = this.innerHTML

})
//Maze-making interface

for (i=0;i<10;i++){
  var newrow = document.createElement('div')
  newrow.className = 'row';
  newrow.id = 'row-'+i.toString()

  for (j=0;j<10;j++){
    var newbut = document.createElement('button')
    newbut.value = 'space';
    newbut.className = 'mazepart'
    newbut.id = 'd'+i.toString()+j.toString()

    newbut.addEventListener('click', function(){
      this.value = partsetter
      this.innerHTML = partimage

      if (this.value == 'wall'){
        $(this).css('background','black')
        return;
      }
      if (this.value == 'gate'){
        $(this).css('background','blue')
      }
      $(this).css('background','white')
    })




    newrow.appendChild(newbut)


  }
  document.getElementById('gamezone').appendChild(newrow)
}
//create an array of zeroes as placeholders before the maze is set.
//this will make indexing easier.
var fullboard = []
for (i=0;i<10;i++){
  var boardrow = []
  for (j=0;j<10;j++){
    boardrow.push(0)
  }
  fullboard.push(boardrow)

}
//function to determine if a square is within the range
function inrange(x){
  let xcor = x[0]
  let ycor = x[1]
  if (xcor <0 || ycor < 0 || xcor >= 10 || ycor >= 10){
    return false;
  }
  return true;
}

//function to determine square adjacencies
function move(square, direction){
  switch (direction) {
    case 'r':
    return [square[0]+1,square[1]]

    case 'l':
    return [square[0]-1,square[1]]

    case 'u':
    return [square[0],square[1]-1]

    case 'd':
    return [square[0],square[1]+1]



  }
}


//update the colors of the squares according to the bot's valuation
//the numbers get pretty big fast, which isn't a problem for
//the AI but it is for us. This normalizes the relative values
//so we can convert them into a shade of red (darker shade means AI likes
//it less)

//trying a new thing. tracking worst val, using that as benchmark for solid red.
var worstval = [0,0]

function updatecolors(stepnum,keystat){
  for (i=0;i<fullboard.length;i++){
    for (j=0;j<fullboard[i].length;j++){

      if (fullboard[i][j].stat == 'wall' || fullboard[i][j].stat == 'gate' || fullboard[i][j].stat == 'ungate'){
        continue;
      }
      z = fullboard[i][j]

      //this scaling factor seems to work okay. Might fiddle with it later
      var shade = 255*(1-z.val[keystat]/worstval[keystat]).toString()
      z.jquerid.css('background','rgb(255,'+shade+','+shade+')')
    }
  }
}

//constructor for maze components
function square(coord){
  this.x = coord[0]
  this.y = coord[1]

  this.pos = coord
  this.jquerid = $('#d'+this.y.toString()+this.x.toString())

//valuations given different states. only states the AI knows
// are: has it picked up a key?
  this.val = [0,0];


//type of component. Empty space, key, gate, start, finish, wall
  this.stat = 'space';

//get list of neighbors.
  this.neighborlist = function(){
    var neighbors = []
    for (k=0;k<4;k++){
      let testsquare = move(this.pos, ['r','l','u','d'][k])
      if (inrange(testsquare) == false){
        continue;
      }


      let b = fullboard[testsquare[0]][testsquare[1]]
      //gate changes to 'ungate' when key is picked up.
        if (b.stat=='wall' || b.stat == 'gate'){
        continue;
      }
      neighbors.push(b)
    }
    return neighbors

  }
//evaluate neighbors to find the most desirable square given
//the keystat (has the AI picked up a key)
  this.bestneighbor = function(keystat){

    //get the best neighboring value
    var bestval = this.neighborlist()[0].val[keystat]
    let lam = this.neighborlist().length;
    for (i=0;i<lam;i++){
      if (this.neighborlist()[i].val[keystat] > bestval){
        bestval = this.neighborlist()[i].val[keystat]
      }
    }

    //randomly choose a neighbor with that value in case of tie
    //there will be a lot of ties, especially early on
    let topchoices = this.neighborlist().filter(x => x.val[keystat] == bestval)
    var finalchoice = topchoices[Math.floor(Math.random()*topchoices.length)]
    return finalchoice
  }


  //update the value of the square the bot is leaving by
  //averaging it with it's neighbors, subtracting one.

  //trying to get values to reflect 'expected number of
  //steps until finish'
  this.updateval = function(keystat){
    var neighborvals = 0


    var lamda = this.neighborlist()
    for (i=0;i<lamda.length;i++){
      neighborvals += lamda[i].val[keystat]

    }
    let newval = neighborvals/lamda.length;
    return newval - 1
  }
}

//create the maze the user built
function makeboard(){
  for (i=0;i<10;i++){
    for (j=0;j<10;j++){
      var z = new square([i,j])
      z.stat = z.jquerid.val()
      if (z.stat == 'key'){
        keyspot = z
      }
      if (z.stat == 'gate'){
        gatespot = z
      }
      if (z.stat == 'start'){

        starter = z
      }

      fullboard[i][j] = z

    }
  }

}

//store the start position, key and gate spot for referencing convencience
var starter;
var keyspot;
var gatespot;




var robot = {

//position, in the form of a maze component.
  pos: starter,

//total of steps taken since first run. NOT reset each run.

  stepper:0,

//path taken during the run. AI remembers path since begining of run,
//but not previous runs.
  path: [],

//does the AI have the key?
  haskey:0,

  //starts run, resets maze (but not values/stepper)
  startrun: function(){
    this.pos = starter
    this.path = []
    this.haskey = 0;

    //if there is a gate, lock it again
    if (gatespot){
      gatespot.stat = 'gate'
      gatespot.jquerid.html('🔒')
    }

    //if there is a key, place it again
    if (keyspot){
      keyspot.stat = 'key'
      keyspot.innerHTML = '🗝️'
    }

    //put the bot back at the starting pos, initiate greed loop
    $('#mazebot').animate({left:50*starter.pos[0].toString()+'px',top:50*starter.pos[1].toString()+'px'},10,robot.greedyrun())

  },

 //main recursive function.
 //so called because it acts 'greedily', making the move with the best valuation
 //exploration is encouraged by the fact that unexplored squares have
 //valuation 0, which is a maximum.

  greedyrun: function(){

//if the bot is at the end, start the next run
    if (this.pos.stat == 'end'){
      this.startrun()

      return;
    }

//if the bot is on the key, pick it up. Unlock the gate.
    if (this.pos.stat == 'key'){
      this.haskey = 1;
      this.pos.stat = 'unkey'
      this.pos.innerHTML = ''
      if (gatespot){
        //neighbor list filters out maze parts w status 'gate',
        //so any change of status name puts it in play
        gatespot.stat = 'ungate'
        gatespot.jquerid.html('')
      }
    }

    //commit to next square. best valuation given key status
    var nextsquare = this.pos.bestneighbor(this.haskey)
    let xcor = nextsquare.pos[0]
    let ycor = nextsquare.pos[1]

    this.stepper+=1

    //add current square to path. punish visited squares.
    //this punishment is pretty harsh, but 'good' squares can recover
    //pretty easily via the individual valuation. no room to explain here.
    this.path.push(this.pos)
    for (i=0;i<this.path.length;i++){
      this.path[i].val[this.haskey] -= 1/Math.log(this.stepper+3)
      if (this.path[i].val[this.haskey] < worstval[this.haskey]){
        worstval[this.haskey] = this.path[i].val[this.haskey];
      }


    }
    //update valuation of  square
    this.pos.val[this.haskey] = this.pos.updateval(this.haskey)
    if (this.pos.val[this.haskey] < worstval[this.haskey]){
      worstval[this.haskey] = this.pos.val[this.haskey]
    }

    //update the colors
    updatecolors(this.stepper,this.haskey)

    //officially move to the next square
    this.pos = nextsquare

    //actually animate the bot to the next square. function recurses.
    $('#mazebot').animate({left:50*xcor.toString()+'px',top:50*ycor.toString()+'px'},200,function(){
      robot.greedyrun()
    })
  }

}



//add listener to start button to trigger this whole thing.
$('#startbutton').on('click', function(){

  $('#mazebot').show();

  makeboard()


  robot.startrun()

})
