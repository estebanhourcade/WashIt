#pragma strict
#pragma implicit
#pragma downcast

var baseTex : Texture2D;
var myTexture : Texture2D;
var dickTexture : Texture2D;

private var dragStart : Vector2;
private var dragEnd : Vector2;
enum Tool {
	Eraser
}
private var tool2 : int = 1;
var AntiAlias : Samples = Samples.Samples4;
var tool : Tool = Tool.Eraser;
var lineWidth : float = 1;
var strokeWidth : float = 1;
var eraser : EraserTool;
var zoom : int = 1;
var BezierPoints : BezierPoint[];

function createTexture(){
	baseTex = Texture2D.Instantiate(myTexture);
	dickTexture = Texture2D.Instantiate(dickTexture);
}

function Start(){
	createTexture();
}

function OnGUI () {
	tool = Tool.Eraser;

	switch (tool) {
		case Tool.Eraser:
			eraser.width = 10;
			eraser.hardness = 10;
			break;
		break;
	}
	
	
	GUI.DrawTexture (Rect (100,0,dickTexture.width*zoom,dickTexture.height*zoom),dickTexture);
	GUI.DrawTexture (Rect (100,0,baseTex.width*zoom,baseTex.height*zoom),baseTex);
}
private var preDrag : Vector2;
function Update () {
	var imgRect : Rect = Rect (5+100,5,baseTex.width*zoom,baseTex.height*zoom);
	var mouse : Vector2 = Input.mousePosition;
	mouse.y = Screen.height-mouse.y;

	if (Input.GetKeyDown ("mouse 0")) {
		
		if (imgRect.Contains (mouse)) {
			
			dragStart = mouse - Vector2 (imgRect.x,imgRect.y);
			dragStart.y =imgRect.height-dragStart.y;
			dragStart.x = Mathf.Round (dragStart.x/zoom);
			dragStart.y = Mathf.Round (dragStart.y/zoom);
			
			dragEnd = mouse - Vector2 (imgRect.x,imgRect.y);
			dragEnd.x = Mathf.Clamp (dragEnd.x,0,imgRect.width);
			dragEnd.y = imgRect.height-Mathf.Clamp (dragEnd.y,0,imgRect.height);
			dragEnd.x = Mathf.Round ( dragEnd.x/zoom);
			dragEnd.y = Mathf.Round ( dragEnd.y/zoom);
		} else {
			dragStart=Vector3.zero;
		}
		
	}
	if (Input.GetKey ("mouse 0")) {
		if (dragStart==Vector3.zero) {
			return;
		}
		dragEnd = mouse - Vector2 (imgRect.x,imgRect.y);
		dragEnd.x = Mathf.Clamp (dragEnd.x,0,imgRect.width);
		dragEnd.y = imgRect.height-Mathf.Clamp (dragEnd.y,0,imgRect.height);
		dragEnd.x = Mathf.Round ( dragEnd.x/zoom);
		dragEnd.y = Mathf.Round ( dragEnd.y/zoom);
		
		if (tool==Tool.Eraser) {
			Eraser (dragEnd,preDrag);
		}
		
	}
	if (Input.GetKeyUp ("mouse 0") && dragStart != Vector2.zero) {
		dragStart=Vector2.zero;
		dragEnd=Vector2.zero;
	}
	preDrag = dragEnd;
}

function Eraser (p1 : Vector2,p2 : Vector2) {
	Drawing.NumSamples=AntiAlias;
	if (p2 == Vector3.zero) {
		p2 = p1;
	}
	Drawing.PaintLine (p1,p2,eraser.width,Color.white,eraser.hardness,baseTex);
	baseTex.Apply ();
}

class EraserTool {
	var width : float = 1;
	var hardness : float = 1;
}
