import math
import random
fullboard = []

for i in range(10):
    for j in range(10):
        fullboard.append((i,j))

def move(square,direction):
    if direction == 'r':
        return (square[0]+1,square[1])

    if direction == 'l':
        return (square[0]-1,square[1])

    if direction == 'u':
        return (square[0],square[1]-1)

    if direction == 'd':
        return (square[0],square[1]+1)

squarestats = {}

class boardsquare:
    def __init__(self,spot,val,rate):
        self.spot = spot
        self.val = val
        self.rate = rate
        self.end = False

    def neighbors(self):
        myneighbors = []
        for i in ['u','l','r','d']:
            square = self.spot
            if move(square,i) in squarestats:
                neighborspot = move(square,i)
                neighbor = squarestats[neighborspot]
                myneighbors.append(neighbor)
        return myneighbors

    def bestneighbor(self):
        topchoices = []
        bestval = self.neighbors()[0].val
        for i in self.neighbors():
            if i.val > bestval:
                bestval = i.val
        for j in self.neighbors():
            if j.val == bestval:
                topchoices.append(j)
        finalchoice = random.choice(topchoices)


        return finalchoice

    def updateval(self):
        neighborvals = 0

        for i in self.neighbors():
            neighborvals += i.val
        newval = neighborvals/len(self.neighbors())
        return newval - 1



class robot:
    def __init__(self,pos,runs):
        self.pos = pos
        self.runs = 0

    def greedmove(self):
        self.pos.val = self.pos.updateval()
        self.pos = self.pos.bestneighbor()

    def mazerun(self):
        z = 0
        while self.pos.end == False:
            self.greedmove()


            z+=1
            if self.pos.end == True:


                self.pos = squarestats[(0,0)]
                print(z)
                return
            if z == 1000:
                print('i am done')

                return;






for square in fullboard:
    newone = boardsquare(square,0,0)
    squarestats[square] = newone

squarestats[(9,9)].end = True

    #squarestats[square] = [0, 0]





robo1 = robot(squarestats[(0,0)],0)
for i in range(5):

    robo1.mazerun()
def weightvals():
    valarray = []
    for a in squarestats:
        valarray.append(squarestats[a].val)
    totsum = sum(valarray)
    totav = totsum/len(valarray)
    for j in squarestats:
        print(j, float(squarestats[j].val)/float(totav))
for g in squarestats:
    print(squarestats[g].val)
