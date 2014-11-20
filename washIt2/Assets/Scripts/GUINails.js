#pragma strict

@script ExecuteInEditMode()

var painter : Painter; 
function Start () {
	painter = this.gameObject.GetComponent(Painter);
}

function Update () {

}

function OnGUI(){
	if (GUI.Button (Rect (10,10,150,100), "I am a button"))
		painter.resetTexture();
		
	if (GUI.Button (Rect (Screen.width - 150 - 10,10,150,100), "I am a button2"))
		painter.cardTextureApply(1);	
	if (GUI.Button (Rect (Screen.width - 150 - 10,10 + 10 + 100,150,100), "I am a button3"))
		painter.cardTextureApply(2);		
			
}