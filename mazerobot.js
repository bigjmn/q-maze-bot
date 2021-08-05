var partsetter = 'space'
var partimage = ''
$('.panelpart').on('click', function(){
  partsetter = this.id
  partimage = this.innerHTML

})
//Drawing the maze

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
function getdir(current, target){

  let xdiff = target[0]-current[0]
  let ydiff = target[1]-current[1]

  if (xdiff == 0){
    if (ydiff == 1){
      return 'd'
    }
    return 'u'
  }
  if (xdiff == 1){
    return 'r'
  }
  if (xdiff == -1){
    return 'l'
  }
  return 'help'




}
//update the colors of the squares according to the bot's valuation
//the numbers get pretty big fast, which isn't a problem for
//the AI but it is for us. This normalizes the relative values
//so we can convert them into a shade of red (darker shade means AI likes
//it less)
function updatecolors(stepnum,keystat){
  for (i=0;i<fullboard.length;i++){
    for (j=0;j<fullboard[i].length;j++){

      if (fullboard[i][j].stat == 'wall' || fullboard[i][j].stat == 'gate' || fullboard[i][j].stat == 'ungate'){
        continue;
      }
      z = fullboard[i][j]

      var shade = 255*(1+z.val[keystat]/stepnum**.8).toString()
      z.jquerid.css('background','rgb(255,'+shade+','+shade+')')
    }
  }
}

function square(coord){
  this.x = coord[0]
  this.y = coord[1]

  this.pos = coord
  this.jquerid = $('#d'+this.y.toString()+this.x.toString())



  this.val = [0,0];



  this.stat = 'space';



  this.end = false;

  this.neighborlist = function(){
    var neighbors = []
    for (k=0;k<4;k++){
      let testsquare = move(this.pos, ['r','l','u','d'][k])
      if (inrange(testsquare) == false){
        continue;
      }


      let b = fullboard[testsquare[0]][testsquare[1]]
        if (b.stat=='wall' || b.stat == 'gate'){
        continue;
      }
      neighbors.push(b)
    }
    return neighbors

  }

  this.bestneighbor = function(keystat){
    var bestval = this.neighborlist()[0].val[keystat]
    let lam = this.neighborlist().length;
    for (i=0;i<lam;i++){
      if (this.neighborlist()[i].val[keystat] > bestval){
        bestval = this.neighborlist()[i].val[keystat]
      }
    }
    let topchoices = this.neighborlist().filter(x => x.val[keystat] == bestval)
    var finalchoice = topchoices[Math.floor(Math.random()*topchoices.length)]
    return finalchoice
  }



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

//store the start position
var starter;
var keyspot;
var gatespot;




var robot = {

  pos: starter,

  stepper:0,

  path: [],

  haskey:0,

  //starts run, resets maze but not values
  startrun: function(){
    this.pos = starter
    this.path = []
    this.haskey = 0;
    if (gatespot){
      gatespot.stat = 'gate'
      gatespot.jquerid.html('🔒')
    }
    if (keyspot){
      keyspot.stat = 'key'
      keyspot.innerHTML = '🗝️'
    }

    $('#mazebot').animate({left:50*starter.pos[0].toString()+'px',top:50*starter.pos[1].toString()+'px'},10,robot.greedyrun())

  },

  greedyrun: function(){


    if (this.pos.stat == 'end'){
      this.startrun()



      return;
    }
    if (this.pos.stat == 'key'){
      this.haskey = 1;
      this.pos.stat = 'unkey'
      this.pos.innerHTML = ''
      if (gatespot){
        gatespot.stat = 'ungate'
        gatespot.jquerid.html('')
      }
    }
    var nextsquare = this.pos.bestneighbor(this.haskey)
    let xcor = nextsquare.pos[0]
    let ycor = nextsquare.pos[1]

    this.stepper+=1




    this.path.push(this.pos)
    for (i=0;i<this.path.length;i++){
      this.path[i].val[this.haskey] -= 1/Math.log(this.stepper+3)


    }
    this.pos.val[this.haskey] = this.pos.updateval(this.haskey)
    updatecolors(this.stepper,this.haskey)
    this.pos = nextsquare


    $('#mazebot').animate({left:50*xcor.toString()+'px',top:50*ycor.toString()+'px'},200,function(){
      robot.greedyrun()
    })
  }

  // currpath: [],
  //
  // greedymove: function(){
  //   this.pos.val = this.pos.updateval()
  //   movebot(this.pos.pos)
  //   console.log(this.pos.pos)
  //
  //
  //   this.currpath.push(getdir(this.pos.pos,this.pos.bestneighbor().pos))
  //   this.pos = this.pos.bestneighbor()
  // },
  //
  // mazerun: function(){
  //   this.pos = fullboard[0][0]
  //   step = 0
  //   while (this.pos.end == false){
  //     this.greedymove();
  //
  //
  //     step++
  //
  //   }
  //   console.log(step)
  //   console.log(this.currpath)
  //   this.currpath = []
  //   console.log('done')
  //
  // }
}








$('#startbutton').on('click', function(){

  makeboard()


  robot.startrun()

})


// for (i=0;i<10;i++){
//   var boardrow = document.createElement('div');
//   boardrow.className = 'row';
//   boardrow.id = 'row'+i.toString();
//
//   for (j=0;j<10;j++){
//     var newsquare = document.createElement('input');
//
// // I'm using buttons because they have a built
// //in focusing feature.
//     newsquare.type='button';
//   }
//
// }
