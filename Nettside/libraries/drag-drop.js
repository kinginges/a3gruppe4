//code for dynamic drag and drop boxes. Might need some bug fixing
//inspiration taken from https://javascript.info/mouse-drag-and-drops
var dragBox = document.getElementsByClassName("dragBox");
var dragElement = document.getElementsByClassName("dragElement");

for (let i=0; i<dragElement.length; i++) {

  dragElement[i].style.position = 'absolute';
  dragElement[i].style.zIndex = 1;

  dragBox[i].onmousedown = function(event) {

    //sets the box in "move mode"
    dragElement[i].style.zIndex = 1000;

    //saves the shift of the pointer in relation to the position of the dragElement
    var xshift = event.pageX - dragElement[i].offsetLeft;
    var yshift = event.pageY - dragElement[i].offsetTop;

    //function that moves the dragElement to its new position
    function moveAt(xpos, ypos) {
      xRelPos = (xpos/window.innerWidth)*100;
      yRelPos = (ypos/window.innerHeight)*100;

      dragElement[i].style.left = xRelPos + "%";
      dragElement[i].style.top = yRelPos + "%";
    }

    //function that registres the movement of the pointer and figures out the new position using the previously saved shift
    function onMouseMove(event) {
      var newXpos = event.pageX - xshift;
      var newYpos = event.pageY - yshift;

      moveAt(newXpos, newYpos);
    }

    document.addEventListener('mousemove', onMouseMove);

    //drops the dragElement
    document.onmouseup = function() {
      document.removeEventListener('mousemove', onMouseMove);
      document.onmouseup = null;
      xshift = null;
      yshift = null;
    };

  };

  //this bit is only necessary if the dragBox is an image
  dragBox[i].ondragstart = function() {
    return false;
  };

}
