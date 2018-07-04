#version 150

#define SAMPLER0 sampler2D // sampler2D, sampler3D, samplerCube
#define SAMPLER1 sampler2D // sampler2D, sampler3D, samplerCube
#define SAMPLER2 sampler2D // sampler2D, sampler3D, samplerCube
#define SAMPLER3 sampler2D // sampler2D, sampler3D, samplerCube

uniform SAMPLER0 iChannel0; // image/buffer/sound    Sampler for input textures 0
uniform SAMPLER1 iChannel1; // image/buffer/sound    Sampler for input textures 1
uniform SAMPLER2 iChannel2; // image/buffer/sound    Sampler for input textures 2
uniform SAMPLER3 iChannel3; // image/buffer/sound    Sampler for input textures 3

uniform vec3  iResolution;           // image/buffer          The viewport resolution (z is pixel aspect ratio,            usually 1.0)
uniform float iTime;                 // image/sound/buffer    Current time in seconds
uniform float iTimeDelta;            // image/buffer          Time it takes to render a frame, in seconds
uniform int   iFrame;                // image/buffer          Current frame
uniform float iFrameRate;            // image/buffer          Number of frames rendered per second
uniform vec4  iMouse;                // image/buffer          xy = current pixel coords (if LMB is down). zw = click pixel
uniform vec4  iDate;                 // image/buffer/sound    Year, month, day, time in seconds in .xyzw
uniform float iSampleRate;           // image/buffer/sound    The sound sample rate (typically 44100)
uniform float iChannelTime[4];       // image/buffer          Time for channel (if video or sound), in seconds
uniform vec3  iChannelResolution[4]; // image/buffer/sound    Input texture resolution for each channel
uniform int   iSwitch;               // image/buffer          Input integer for using as a switch

#define STEPS       128
#define FAR         10.
#define PI acos( -1.0 )
//#define PROCEDURAL
#define HASHSCALE .1031

mat2 rot( float a )
{
    
    return mat2( cos( a ), -sin( a ),
                sin( a ),  cos( a )
                );
    
}

/*
 float hash( float n )
 {
 
 return fract( sin( n ) * 45843.349 );
 
 }
 */

// https://www.shadertoy.com/view/4djSRW

float hash(float p)
{
    vec3 p3  = fract(vec3(p) * HASHSCALE);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

// iq's

#ifdef PROCEDURAL

float noise( in vec3 x )
{
    
    vec3 p = floor( x );
    vec3 k = fract( x );
    
    k *= k * k * ( 3.0 - 2.0 * k );
    
    float n = p.x + p.y * 57.0 + p.z * 113.0;
    
    float a = hash( n );
    float b = hash( n + 1.0 );
    float c = hash( n + 57.0 );
    float d = hash( n + 58.0 );
    
    float e = hash( n + 113.0 );
    float f = hash( n + 114.0 );
    float g = hash( n + 170.0 );
    float h = hash( n + 171.0 );
    
    float res = mix( mix( mix ( a, b, k.x ), mix( c, d, k.x ), k.y ),
                    mix( mix ( e, f, k.x ), mix( g, h, k.x ), k.y ),
                    k.z
                    );
    
    return res;
    
}

#else

float noise( in vec3 x )
{
    
    
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    
    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
    vec2 rg = textureLod( iChannel1, (uv+ 0.5)/256.0, 0.0 ).yx;
    return mix( rg.x, rg.y, f.z );
    
}

#endif

float fbm( in vec3 p )
{
    
    //float wav = texture( iChannel2, vec2( 0.0, 0.25 ) ).x;
    //float fre = texture( iChannel2, vec2( 0.0, 0.15 ) ).x;
    float f = 0.0;
    f += 0.5000 * noise( p ); p *= 2.02;// p -= iTime * 0.5 + wav;
    f += 0.2500 * noise( p ); p *= 2.03;// p += iTime * 0.4 + fre;
    f += 0.1250 * noise( p ); p *= 2.01;// p -= iTime * 0.5 + wav;
    f += 0.0625 * noise( p );
    f += 0.0125 * noise( p );
    return f / 0.9375;
    
}

float map( vec3 p )
{
    
    //return p.y + 1.0 * fbm( p + iTime * 0.2 );
    //float f = 1.7 - length( p ) * fbm( p );
    
    //p.zy *= rot( iTime * 0.1 );
    
    p.z -= iTime * 0.5;
    
    float f = fbm( p );
    
    return f;
    
}

float ray( vec3 ro, vec3 rd, out float den )
{
    
    float t = 0.0, maxD = 0.0, d = 1.0; den = 0.0;
    
    for( int i = 0; i < STEPS; ++i )
    {
        
        vec3 p = ro + rd * t;
        
        den = d * ( map( p ) * t * t * 0.025 );
        //den = map( p );
        maxD = maxD < den ? den : maxD;
        
        if( maxD > 1.0 || t > FAR ) break;
        
        // https://www.shadertoy.com/view/MscXRH
        t += max( maxD*.1, .05 );
        
        //t += 0.05;
        
    }
    
    den = maxD;
    
    return t;
    
}

vec3 shad( vec3 ro, vec3 rd, vec2 uv )
{
    
    float den = 0.0;
    float t = ray( ro, rd, den );
    
    vec3 p = ro + rd * t;
    
    float red = iMouse.z;
    float green = iMouse.w;
    float blue = iResolution.z;
    
    vec3 col = mix( vec3( 0 ),
                   mix( vec3( 0.4 + red, fbm( p ) + green, 0.2 ),
                        vec3( fbm( p ) + 0.9 + red, 0.9 + green, 0.5 ),
                        den
                       ), den * .5
                   );
    
    col *= sqrt( col );
    
    return col;
    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec2 uv = ( -iResolution.xy + 2.0 * fragCoord ) / iResolution.y;
    vec2 p = fragCoord / iResolution.xy;
    
    vec2 mou = iMouse.xy / iResolution.xy;
    
    /*
     vec3 ro = 3.0 * vec3( sin( mou.x * 2.0 * PI ), 0.0, cos( -mou.x * 2.0 * PI ) );
     vec3 ww = normalize( vec3( 0 ) - ro );
     vec3 uu = normalize( cross( vec3( 0, 1, 0 ), ww ) );
     vec3 vv = normalize( cross( ww, uu ) );
     vec3 rd = normalize( uv.x * uu + uv.y * vv + 1.5 * ww );
     */
    vec3 ro = vec3( mou.x, mou.y, 2.5 );
    vec3 rd = normalize( vec3( uv, -1.0 ) );
    /*ro.zy *= rot( -mou.y * 6.28 );
     rd.zy *= rot( -mou.y * 6.28 );
     ro.xy *= rot( mou.x * 6.28 );
     rd.xy *= rot( mou.x * 6.28 );*/
    
    ro.zy *= rot( -iTime * 0.1 );
    rd.zy *= rot( -iTime * 0.1 );
    ro.xy *= rot( -iTime * 0.1 );
    rd.xy *= rot( -iTime * 0.1 );
    
    float den = 0.0, t = ray( ro, rd, den );
    
    vec3 poi = ro + rd * t;
    
    vec3 col = shad( ro, rd, uv );
    
    vec3 sta = texture( iChannel0, p ).rgb;
    
    sta += col;
    
    // Output to screen
    fragColor = vec4(sta,1.0);
}
