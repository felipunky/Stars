/**
 * 
 * PixelFlow | Copyright (C) 2017 Thomas Diewald - www.thomasdiewald.com
 * 
 * https://github.com/diwi/PixelFlow.git
 * 
 * A Processing/Java library for high performance GPU-Computing.
 * MIT License: https://opensource.org/licenses/MIT
 * 
 */



import com.jogamp.opengl.GL2;
import com.thomasdiewald.pixelflow.java.DwPixelFlow;
import com.thomasdiewald.pixelflow.java.dwgl.DwGLTexture;
import com.thomasdiewald.pixelflow.java.imageprocessing.DwShadertoy;
import com.thomasdiewald.pixelflow.java.imageprocessing.filter.DwFilter;
import processing.core.PImage;
import controlP5.*;

//
// Shadertoy Demo: NebulaIterations  
// Shadertoy Author: felipunkerito
//

// Basic 2-pass demo to get started.
//
// toyA: Test_BufA.frag ... creates some output
// toy : Test.frag      ... simply copies the result from toyA

DwPixelFlow context;
DwShadertoy toy, toyA;

// Sliders
ControlP5 Control;

DwGLTexture tex_0 = new DwGLTexture();

float rotX = 0.0;
float rotY = 0.0;
float Mouse_Rate = 0.6;

float swi = 0;

float red_Colour = 0.0;
float green_Colour = 0.0;
float blue_Colour = 0.0;

public void settings() {
  size(500, 281, P2D);
  smooth(0);
}

public void setup() {

  Control = new ControlP5( this );  
  
  Control.addSlider( "Mouse_Rate" )
    .setPosition( 345, 5 )
    .setRange( 0, 1 );
    
  Control.addSlider( "red_Colour" )
    .setPosition( 345, 15 )
    .setRange( 0, 1 )
    ;  
    
  Control.addSlider( "green_Colour" )
    .setPosition( 345, 25 )
    .setRange( 0, 1 )
    ;
    
  Control.addSlider( "blue_Colour" )
    .setPosition( 345, 35 )
    .setRange( 0, 1 )
    ;
    
  Control.addButton( "swi" )
    .setValue( 0 )
    .setPosition( 345, 265 )
    .setSize( 100, 10 )
    ;

  surface.setResizable(true);

  context = new DwPixelFlow(this);
  context.print();
  context.printGL();

  toyA = new DwShadertoy(context, "data/Test_BufA.frag");
  toy  = new DwShadertoy(context, "data/Test.frag");

  PImage img0 = loadImage("data/Noise.png");

  // create textures
  tex_0.resize(context, GL2.GL_RGBA8, img0.width, img0.height, GL2.GL_RGBA, GL2.GL_UNSIGNED_BYTE, GL2.GL_LINEAR, GL2.GL_CLAMP, 4, 1);

  // copy images to textures
  DwFilter.get(context).copy.apply(img0, tex_0);

  // mipmap
  DwShadertoy.setTextureFilter(tex_0, DwShadertoy.TexFilter.LINEAR); 
  //DwShadertoy.setTextureWrap(tex_0, DwShadertoy.TexWrap.CLAMP);

  frameRate(60);
}


public void draw() {

  toyA.apply(width, height);
  toyA.set_iMouse(rotY, rotX, 0, 0);
  //toyA.set_iChannel(0, toyA);
  if( swi == 0.0 )
  {
    
    toyA.reset();
  
  }

  toy.set_iChannel(0, toyA);
  toy.apply(width, height);
  toy.set_iMouse(rotY, rotX, red_Colour, green_Colour);
  toy.set_iChannel(1, tex_0);
  toy.set_iSampleRate(swi);
  if( swi == 0.0 )
  {
    
    toy.reset();
  
  }
  
  toy.apply(this.g);

  String txt_fps = String.format(getClass().getSimpleName()+ "   [size %d/%d]   [frame %d]   [fps %6.2f]", width, height, frameCount, frameRate);
  surface.setTitle(txt_fps);
  
}

// function colorA will receive changes from 
// controller with name colorA
public void swi() {
  println("The button value is: " + swi);
  if( swi == 0.0 )
  {
    
    swi = 1.0;
    
  }
  else if( swi == 1.0 )
  {
  
    swi = 0.0;
  
  }
  
}

void mouseDragged() 
{

  rotX += (pmouseY-mouseY) * Mouse_Rate;
  rotY += (mouseX-pmouseX) * Mouse_Rate;
  
}
