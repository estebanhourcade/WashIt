#pragma strict
#pragma implicit
#pragma downcast

import Mathfx;
import Samples;

enum Samples {
	None,
	Samples2,
	Samples4,
	Samples8,
	Samples16,
	Samples32,
	RotatedDisc
}

static var NumSamples : Samples = Samples.Samples4;

static function PaintLine (from : Vector2,to : Vector2,rad : float,col : Color,hardness : float,tex : Texture2D) {
	width = rad*2;
	
	extent = rad;
	stY = Mathf.Clamp (Mathf.Min (from.y,to.y)-extent,0,tex.height);
	stX =  Mathf.Clamp (Mathf.Min (from.x,to.x)-extent,0,tex.width);
	endY = Mathf.Clamp (Mathf.Max (from.y,to.y)+extent,0,tex.height);
	endX = Mathf.Clamp (Mathf.Max (from.x,to.x)+extent,0,tex.width);
	
	
	lengthX = endX-stX;
	lengthY = endY-stY;
	
	sqrRad = rad*rad;
	sqrRad2 = (rad+1)*(rad+1);
	var pixels : Color[] = tex.GetPixels (stX,stY,lengthX,lengthY,0);
	start = Vector2 (stX,stY);
	//Debug.Log (widthX + "   "+ widthY + "   "+ widthX*widthY);
	for (y=0;y<lengthY;y++) {
		for (x=0;x<lengthX;x++) {
			p = Vector2 (x,y) + start;
			center = p + Vector2(0.5,0.5);
			var dist : float = (center-NearestPointStrict(from,to,center)).sqrMagnitude;
			if (dist>sqrRad2) {
				continue;
			}
			dist = GaussFalloff (Mathf.Sqrt(dist),rad) * hardness;
			//dist = (samples[i]-pos).sqrMagnitude;
			if (dist>0) {
				c =Color.Lerp (pixels[y*lengthX+x],col,dist);
				c.a = 0;
			} else {
				c =pixels[y*lengthX+x];
			}
			
			pixels[y*lengthX+x]=c;
		}
	}
	tex.SetPixels (start.x,start.y,lengthX,lengthY,pixels,0);
	return tex;
}

class BezierPoint {
	var main : Vector2;
	var control1 : Vector2;//Think of as left
	var control2 : Vector2;//Right
	//var rect : Rect;
	var curve1 : BezierCurve;//Left
	var curve2 : BezierCurve;//Right
	
	function BezierPoint (m : Vector2,l : Vector2,r : Vector2) {
		main = m;
		control1 = l;
		control2 = r;
	}
}

class BezierCurve {
	var points : Vector2[];
	var aproxLength : float;
	var rect : Rect;
	function Get (t : float) {
		var t2 : int = Mathf.Round (t*(points.length-1));
		return points[t2];
	}
	
	function Init (p0 : Vector2,p1 : Vector2,p2 : Vector2,p3 : Vector2) {
		
		var topleft : Vector2 = Vector2(Mathf.Infinity,Mathf.Infinity);
		var bottomright : Vector2 = Vector2(Mathf.NegativeInfinity,Mathf.NegativeInfinity);
		
		topleft.x = Mathf.Min (topleft.x,p0.x);
		topleft.x = Mathf.Min (topleft.x,p1.x);
		topleft.x = Mathf.Min (topleft.x,p2.x);
		topleft.x = Mathf.Min (topleft.x,p3.x);
		
		topleft.y = Mathf.Min (topleft.y,p0.y);
		topleft.y = Mathf.Min (topleft.y,p1.y);
		topleft.y = Mathf.Min (topleft.y,p2.y);
		topleft.y = Mathf.Min (topleft.y,p3.y);
		
		bottomright.x = Mathf.Max (bottomright.x,p0.x);
		bottomright.x = Mathf.Max (bottomright.x,p1.x);
		bottomright.x = Mathf.Max (bottomright.x,p2.x);
		bottomright.x = Mathf.Max (bottomright.x,p3.x);
		
		bottomright.y = Mathf.Max (bottomright.y,p0.y);
		bottomright.y = Mathf.Max (bottomright.y,p1.y);
		bottomright.y = Mathf.Max (bottomright.y,p2.y);
		bottomright.y = Mathf.Max (bottomright.y,p3.y);
		
		rect = Rect (topleft.x,topleft.y,bottomright.x-topleft.x,bottomright.y-topleft.y);
		
		
		ps = new Array ();
		
		point1  = CubicBezier (0,p0,p1,p2,p3);
		point2  = CubicBezier (0.05,p0,p1,p2,p3);
		point3  = CubicBezier (0.1,p0,p1,p2,p3);
		point4  = CubicBezier (0.15,p0,p1,p2,p3);
		
		point5  = CubicBezier (0.5,p0,p1,p2,p3);
		point6  = CubicBezier (0.55,p0,p1,p2,p3);
		point7  = CubicBezier (0.6,p0,p1,p2,p3);
		
		aproxLength = Vector2.Distance (point1,point2) + Vector2.Distance (point2,point3) + Vector2.Distance (point3,point4)  + Vector2.Distance (point5,point6)  + Vector2.Distance (point6,point7);
		
		Debug.Log (Vector2.Distance (point1,point2) + "     " + Vector2.Distance (point3,point4) + "   " + Vector2.Distance (point6,point7));
		aproxLength*= 4;
		
		var a2 : float = 0.5/aproxLength;//Double the amount of points since the aproximation is quite bad
		for (var i : float = 0 ;i<1;i+=a2) {
			ps.Add (CubicBezier (i,p0,p1,p2,p3));
		}
		
		points = ps.ToBuiltin (Vector2);
	}
	
	function BezierCurve (main : Vector2,control1 : Vector2,control2 : Vector2,end : Vector2) {
		Init (main,control1,control2,end);
	}
}

static function DrawBezier (points : BezierPoint[],rad : float,col : Color,tex : Texture2D) {
	rad = Mathf.Round (rad);//It is important to round the numbers otherwise it will mess up with the texture width
	
	if (points.length<=1) {
		return;
	}
	
	var topleft : Vector2 = Vector2(Mathf.Infinity,Mathf.Infinity);
	var bottomright : Vector2 = Vector2(0,0);
	
	for (i=0;i<points.length-1;i++) {
		var curve : BezierCurve = new BezierCurve (points[i].main,points[i].control2,points[i+1].control1,points[i+1].main);
		points[i].curve2 = curve;
		points[i+1].curve1 = curve;
		
		topleft.x = Mathf.Min (topleft.x,curve.rect.x);
	
		topleft.y = Mathf.Min (topleft.y,curve.rect.y);
	
		bottomright.x = Mathf.Max (bottomright.x,curve.rect.x+curve.rect.width);
	
		bottomright.y = Mathf.Max (bottomright.y,curve.rect.y+curve.rect.height);
	}
	
	topleft-=Vector2(rad,rad);
	bottomright+=Vector2(rad,rad);
	
	start = Vector2 (Mathf.Clamp (topleft.x,0,tex.width),Mathf.Clamp (topleft.y,0,tex.height));
	width = Vector2 (Mathf.Clamp (bottomright.x-topleft.x,0,tex.width-start.x),Mathf.Clamp (bottomright.y-topleft.y,0,tex.height-start.y));
	
	var pixels : Color[] = tex.GetPixels (start.x,start.y,width.x,width.y,0);
	
	for (y=0;y<width.y;y++) {
		for (x=0;x<width.x;x++) {
			p = Vector2(x+start.x,y+start.y);
			if (!IsNearBeziers (p,points,rad+2)) {
				continue;
			}
			
			samples = Sample (p);
			c = Color.black;
			pc = pixels[y*width.x+x];//Previous pixel color
			for (i=0;i<samples.length;i++) {
				if (IsNearBeziers (samples[i],points,rad)) {
					c+= col;
				} else {
					c+= pc;
				}
			}
			
			c /= samples.length;
			
			pixels[y*width.x+x]=c;
			
		}
	}
	
	tex.SetPixels (start.x,start.y,width.x,width.y,pixels,0);
	tex.Apply ();
}

static function Sample (p : Vector2) : Vector2[] {
	switch (NumSamples) {
		case None :
			return [p+Vector2(0.5,0.5)];
		case Samples2 :
			return [p+Vector2(0.25,0.5),p+Vector2(0.75,0.5)];
		case Samples4 : 
			return [
			p+Vector2(0.25,0.5),
			p+Vector2(0.75,0.5),
			p+Vector2(0.5,0.25),
			p+Vector2(0.5,0.75)
			
			];
		case Samples8 : 
			return [
			p+Vector2(0.25,0.5),
			p+Vector2(0.75,0.5),
			p+Vector2(0.5,0.25),
			p+Vector2(0.5,0.75),
			
			p+Vector2(0.25,0.25),
			p+Vector2(0.75,0.25),
			p+Vector2(0.25,0.75),
			p+Vector2(0.75,0.75)
			];
		case Samples16 : 
			return [
			
			p+Vector2(0,0),
			p+Vector2(0.3,0),
			p+Vector2(0.7,0),
			p+Vector2(1,0),
			
			p+Vector2(0,0.3),
			p+Vector2(0.3,0.3),
			p+Vector2(0.7,0.3),
			p+Vector2(1,0.3),
			
			p+Vector2(0,0.7),
			p+Vector2(0.3,0.7),
			p+Vector2(0.7,0.7),
			p+Vector2(1,0.7),
			
			p+Vector2(0,1),
			p+Vector2(0.3,1),
			p+Vector2(0.7,1),
			p+Vector2(1,1)
			];
		case Samples32 :
			return [
			
			p+Vector2(0,0),
			p+Vector2(1,0),
			p+Vector2(0,1),
			p+Vector2(1,1),
			
			p+Vector2(0.2,0.2),
			p+Vector2(0.4,0.2),
			p+Vector2(0.6,0.2),
			p+Vector2(0.8,0.2),
			
			p+Vector2(0.2,0.4),
			p+Vector2(0.4,0.4),
			p+Vector2(0.6,0.4),
			p+Vector2(0.8,0.4),
			
			p+Vector2(0.2,0.6),
			p+Vector2(0.4,0.6),
			p+Vector2(0.6,0.6),
			p+Vector2(0.8,0.6),
			
			p+Vector2(0.2,0.8),
			p+Vector2(0.4,0.8),
			p+Vector2(0.6,0.8),
			p+Vector2(0.8,0.8),
		
			p+Vector2(0.5,0),
			p+Vector2(0.5,1),
			p+Vector2(0,0.5),
			p+Vector2(1,0.5),
			
			p+Vector2(0.5,0.5)
			
			];
		case RotatedDisc :
			return [
			
			p+Vector2(0,0),
			p+Vector2(1,0),
			p+Vector2(0,1),
			p+Vector2(1,1),
			
			p+Vector2(0.5,0.5)+Vector2(0.258,0.965),//Sin (75°) && Cos (75°)
			p+Vector2(0.5,0.5)+Vector2(-0.965,-0.258),
			p+Vector2(0.5,0.5)+Vector2(0.965,0.258),
			p+Vector2(0.5,0.5)+Vector2(0.258,-0.965)
			];
			
		break;
	}
}