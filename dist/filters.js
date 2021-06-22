/**
📸
@file filters
@summary adds post-processing filters to flickguys
@license MIT
@version 1.0.2
@author Sean S. LeBlanc

@description
The main drawing/output canvas is overlaid with
a WebGL canvas which copies the original and applies the filters.

Note that filters will work in remix mode,
but ones which modify UVs may make it difficult draw.

HOW TO USE:
1. Copy-paste this script into a script tag in your flickguy
2. (optional) edit `hackOptions` below with custom filters
*/
this.hacks = this.hacks || {};
(function (exports, flickguy) {
'use strict';
const hackOptions = {
	source: 'https://github.com/seleb/flickguy-hacks/blob/main/dist/filters.js',
	filters: [
		{
			name: 'none',
			shader: undefined,
		},
		{
			name: 'invert',
			shader: `
precision mediump float;
uniform sampler2D tex0;
uniform vec2 resolution;

void main(void) {
	vec2 uv = gl_FragCoord.xy / resolution;
	vec4 col = texture2D(tex0, uv);
	gl_FragColor.rgb = 1.0 - col.rgb;
	gl_FragColor.a = col.a;
}`,
		},
		{
			name: '1-bit',
			scale: 2,
			shader: `
precision mediump float;
uniform sampler2D tex0;
uniform vec2 resolution;
const float posterize = 1.0;

void main(void) {
	vec2 uv = gl_FragCoord.xy / resolution;
	vec4 col = texture2D(tex0, uv);
	vec3 raw = vec3(col.r+col.g+col.b)/3.0;
	vec3 posterized = raw - mod(raw, 1.0/posterize);

	vec2 dit = floor(mod(uv * resolution, 2.0));
	float limit = (dit.x + dit.y) * 0.25 + 0.2;
	vec3 dither = step(limit, (raw - posterized) * posterize) / posterize;

	gl_FragColor.rgb = posterized + dither;
	gl_FragColor.a = col.a;
}`,
		},
		{
			name: 'lcd',
			scale: 8,
			shader: `
// rough simulated lcd pixel grid with shadowing + burn-in
precision mediump float;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform float time;
uniform vec2 resolution;
vec2 uBufferSize = vec2(128, 128);
//https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
float rand(vec2 co){
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
vec3 tex(vec2 uv){
	return texture2D(tex0, uv).rgb;
}
float vignette(vec2 uv, float amount){
	uv*=2.0;
	uv -= 1.0;
	return clamp((1.0-uv.y*uv.y)*(1.0-uv.x*uv.x)/amount, 0.0, 1.0);
}
float grille(vec2 uv, vec2 amount){
	vec2 g = mod(uv*uBufferSize,vec2(1.0));
	g *= 2.0;
	g -= 1.0;
	g = abs(g);
	g.x = 1.0 - g.x*amount.y;
	g.y = 1.0 - g.y*amount.x;
	return 1.0-pow(1.0-g.y*g.x,2.0);
}
void main(void){
	vec2 uv = gl_FragCoord.xy / resolution;
	vec2 puv = floor(uv * uBufferSize + vec2(.5)) / uBufferSize;
	vec3 fg = tex(uv);
	fg += rand(uv) * 0.05; // noise
	// shade
	vec2 uv2 = uv + vec2(-1.0, 1.0)/uBufferSize/3.0;
	vec3 shade = vec3(0.0);//(fg - tex(uv2);
	shade += (fg - tex(uv2 + vec2(-.0,1.0)/uBufferSize/4.0));
	shade += (fg - tex(uv2 + vec2(1.0,-.0)/uBufferSize/4.0));
	shade += (fg - tex(uv2 + vec2(-.0,-.0)/uBufferSize/4.0));
	shade += (fg - tex(uv2 + vec2(1.0,1.0)/uBufferSize/4.0));
	shade /= 4.0;
	fg = fg - max(vec3(0.0), shade) * 0.5;
	fg *= vec3(241.0,255.0,184.0)/255.0; // tint
	fg = mix(fg, vec3(1.0), step(grille(uv, vec2(0.5,0.5)), 0.8)*0.1 * (1.0 - fg.g)); // grid
	fg += rand(puv + 1.0 / 128.0) * 0.01; // grid noise
	
	// burn
	fg *= pow(vignette(uv,0.01), 3.0);
	fg *= mix(vec3(0.9, 0.4, 0.1), vec3(1.0), pow(vignette(uv,0.14), 0.5)*0.5 + 0.5);
	fg *= mix(vec3(0.4, 0.7, 0.1), vec3(1.0), pow(vignette(uv,0.18), 0.5)*0.5 + 0.5);
	fg *= mix(vec3(1.0), vec3(0.3, 0.4, 0.1), vignette(uv,1.0)*0.3);
	fg = mix(fg, texture2D(tex1, uv).rgb, fg.g*0.8);
	
	gl_FragColor = vec4(fg.rgb, 1.0);
}`,
		},
		{
			name: 'upscale',
			scale: 3,
			shader: `
// scale3x port
//
// Original license:
//
// Copyright (C) 2001, 2002, 2003, 2004 Andrea Mazzoleni
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
precision mediump float;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform float time;
uniform vec2 resolution;
const float size = 128.0;
const float px = 1.0/size;
const vec4 t1 = vec4(-px,  0, px,-px);
const vec4 t2 = vec4(-px,  0, px,  0);
const vec4 t3 = vec4(-px,  0, px, px);
bool eq(vec3 A, vec3 B){
	return (A==B);
}
bool neq(vec3 A, vec3 B){
	return (A!=B);
}
void main(){
	vec2 coord = gl_FragCoord.xy;
	vec2 uv = coord.xy / resolution.xy;
	vec4 col = texture2D(tex0,uv);
	vec4 O = col;
	// subpixel determination
	vec2 fp = floor(3.0 * fract(uv*size));
	/*
		A B C		E0 E1 E2
		D E F		E3 E4 E5
		G H I		E6 E7 E8
	*/
	// reading the texels
	vec3 A = texture2D(tex0, uv + t1.xw).rgb;
	vec3 B = texture2D(tex0, uv + t1.yw).rgb;
	vec3 C = texture2D(tex0, uv + t1.zw).rgb;
	vec3 D = texture2D(tex0, uv + t2.xw).rgb;
	vec3 E = texture2D(tex0, uv + t2.yw).rgb;
	vec3 F = texture2D(tex0, uv + t2.zw).rgb;
	vec3 G = texture2D(tex0, uv + t3.xw).rgb;
	vec3 H = texture2D(tex0, uv + t3.yw).rgb;
	vec3 I = texture2D(tex0, uv + t3.zw).rgb;
	// equality checks
	bool eqBD = eq(B,D), eqBF = eq(B,F), eqHD = eq(H,D), eqHF = eq(H,F), neqEA = neq(E,A), neqEC = neq(E,C), neqEG = neq(E,G), neqEI = neq(E,I); 
	// rules
	vec3 E0 = eqBD ? B : E;
	vec3 E1 = eqBD && neqEC || eqBF && neqEA ? B : E;
	vec3 E2 = eqBF ? B : E;
	vec3 E3 = eqBD && neqEG || eqHD && neqEA ? D : E;
	vec3 E5 = eqBF && neqEI || eqHF && neqEC ? F : E;
	vec3 E6 = eqHD ? H : E;
	vec3 E7 = eqHD && neqEI || eqHF && neqEG ? H : E;
	vec3 E8 = eqHF ? H : E;
	// general condition & subpixel output
	col.rgb = neq(B,H) && neq(D,F) ? (fp.y == 0. ? (fp.x == 0. ? E0 : fp.x == 1. ? E1 : E2) : (fp.y == 1. ? (fp.x == 0. ? E3 : fp.x == 1. ? E : E5) : (fp.x == 0. ? E6 : fp.x == 1. ? E7 : E8))) : E;
	gl_FragColor = col;
}`,
		},
		{
			name: 'neon',
			shader: `
precision mediump float;
uniform sampler2D tex0;
uniform vec2 resolution;
const float px = 1.0/128.0;
void main(void){
	vec2 uv = gl_FragCoord.xy / resolution;
	vec2 uvp = uv - mod(uv, px);
	vec4 p = texture2D(tex0, uv);
	vec3 a = texture2D(tex0, uvp + vec2(+0.0,+1.0)*px).rgb;
	vec3 b = texture2D(tex0, uvp + vec2(+0.0,-1.0)*px).rgb;
	vec3 c = texture2D(tex0, uvp + vec2(-1.0,+0.0)*px).rgb;
	vec3 d = texture2D(tex0, uvp + vec2(+1.0,+0.0)*px).rgb;
	float da = distance(p.rgb,a);
	float db = distance(p.rgb,b);
	float dc = distance(p.rgb,c);
	float dd = distance(p.rgb,d);
	gl_FragColor = vec4(a*da + b*db + c*dc + d*dd, p.a);
}`,
		},
		{
			name: 'trash',
			shader: `
precision mediump float;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform float time;
uniform vec2 resolution;
float rand(vec2 co){
	return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}
void main(){
	vec2 coord = gl_FragCoord.xy;
	vec2 uv = coord.xy / resolution.xy;
	vec4 col = texture2D(tex0,uv);
	vec3 bloom = vec3(0);
	const float r = 1.0/64.0;
	const float i = r/10.0;
	vec2 grain = vec2(1.0, 1.0);
	for (float x = 0.0; x <= r; x += i) {
		float f = x;
		vec2 diff = sin(uv / r * 2.0*3.14);
		vec3 c = texture2D(tex0, uv + diff*f).rgb;
		bloom += c;
	}
	bloom /= r / i;
	col.rgb = bloom;
	gl_FragColor = col;
}`,
		},
	],
};

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var flickguy__default = /*#__PURE__*/_interopDefaultLegacy(flickguy);

function t(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function e(t,e){for(var i=0;i<e.length;i++){var s=e[i];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(t,s.key,s);}}function i(t,i,s){return i&&e(t.prototype,i),s&&e(t,s),t}function s(t){if(!s.context&&(s.context=t.getContext("webgl")||t.getContext("experimental-webgl"),!s.context))throw "No WebGL support";return s.context}var n=function(){function e(i,n){t(this,e),this.gl=new s,this.vertSource=i,this.fragSource=n,this.program=this.gl.createProgram();try{this.vertShader=this.compileShader(this.vertSource,this.gl.VERTEX_SHADER),this.fragShader=this.compileShader(this.fragSource,this.gl.FRAGMENT_SHADER);}catch(t){throw this.gl.deleteProgram(this.program),delete this.program,console.error("Couldn't create shader: ",t),t}this.gl.attachShader(this.program,this.vertShader),this.gl.deleteShader(this.vertShader),delete this.vertShader,this.gl.attachShader(this.program,this.fragShader),this.gl.deleteShader(this.fragShader),delete this.fragShader,this.gl.linkProgram(this.program);}return i(e,[{key:"compileShader",value:function(t,e){try{var i=this.gl.createShader(e);if(this.gl.shaderSource(i,t),this.gl.compileShader(i),!this.gl.getShaderParameter(i,this.gl.COMPILE_STATUS))throw this.gl.getShaderInfoLog(i);return i}catch(i){throw console.error("Couldn't compile shader (".concat(e,"): "),t,i),i}}},{key:"useProgram",value:function(){this.gl.useProgram(this.program);}}]),e}(),o=function(){function e(i,n,o){t(this,e),this.gl=new s,this.source=i,this.texture=this.gl.createTexture(),this.bind(n),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,this.source),this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,!0),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,o?this.gl.NEAREST:this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,o?this.gl.NEAREST:this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.bindTexture(this.gl.TEXTURE_2D,null);}return i(e,[{key:"update",value:function(){this.bind(),this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,!0),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.gl.RGBA,this.gl.UNSIGNED_BYTE,this.source),this.gl.bindTexture(this.gl.TEXTURE_2D,null);}},{key:"bind",value:function(t){var e=t||this.lastBoundId||0;this.gl.activeTexture(this.gl.TEXTURE0+e),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.lastBoundId=e;}}]),e}(),r="// default vertex shader\nattribute vec4 position;\nvoid main() {\n\tgl_Position = position;\n}",a="// default fragment shader\nprecision mediump float;\nuniform sampler2D tex0;\nuniform sampler2D tex1;\nuniform vec2 resolution;\n\nvoid main() {\n\tvec2 coord = gl_FragCoord.xy;\n\tvec2 uv = coord.xy / resolution.xy;\n\tgl_FragColor = texture2D(tex0, uv);\n}",h=function(){function e(i){var s=this,n=i.source,o=i.sources,h=void 0===o?["canvas","video","img"]:o,c=i.hideSource,l=void 0===c||c,u=i.background,d=void 0===u?"black":u,g=i.scaleMultiplier,m=void 0===g?1:g,v=i.scaleMode,f=void 0===v?e.SCALE_MODES.FIT:v,p=i.allowDownscaling,E=void 0!==p&&p,T=i.timestep,b=void 0===T?1/60*1e3:T,x=i.disableFeedbackTexture,y=void 0!==x&&x,w=i.disableMouseEvents,S=void 0!==w&&w,A=i.pixelate,L=void 0===A||A,_=i.autoInit,R=void 0===_||_,F=i.vertex,M=void 0===F?r:F,C=i.fragment,k=void 0===C?a:C;t(this,e),this.main=function(t){s.lastTime=s.curTime,s.curTime=(t||s.now())-s.startTime,s.deltaTime=s.curTime-s.lastTime,s.accumulator+=s.deltaTime,s.accumulator>s.timestep&&(s.render(),s.accumulator-=s.timestep),s.requestAnimationFrame(s.main);},this.sources=h,this.source=n||this.getSource(),this.hideSource=l,this.background=d,this.scaleMultiplier=m,this._scale=m,this.scaleMode=f,this.allowDownscaling=E,this.timestep=b,this.disableFeedbackTexture=!!y,this.disableMouseEvents=!!S,this.pixelate=L,this.vertex=M,this.fragment=k,R&&this.init();}return i(e,[{key:"getSource",value:function(){var t,e=[];for(t=0;t<this.sources.length;++t)e.push(Array.prototype.slice.call(document.getElementsByTagName(this.sources[t])));if(0===(e=Array.prototype.concat.apply([],e)).length)throw "Couldn't find an element from "+this.sources+" to use as a source";return e[0]}},{key:"insertStylesheet",value:function(){this.style=document.createElement("style"),document.head.appendChild(this.style),this.style.innerHTML="\nhtml,body,div#canvasContainer{\n\tpadding:0;\n\tmargin:0;\n\n\twidth:100%;\n\theight:100%;\n\n\ttop:0;\n\tleft:0;\n\tright:0;\n\tbottom:0;\n\n\tbackground: ".concat(this.background,";\n\tcolor:#FFFFFF;\n\n\toverflow:hidden;\n\n\t").concat(this.hideSource?"visibility: hidden!important;":"","\n}\n\ncanvas#outputCanvas{\n").concat(this.pixelate?"\n\timage-rendering: optimizeSpeed;\n\timage-rendering: -webkit-crisp-edges;\n\timage-rendering: -moz-crisp-edges;\n\timage-rendering: -o-crisp-edges; \n\timage-rendering: crisp-edges;\n\timage-rendering: -webkit-optimize-contrast;\n\timage-rendering: optimize-contrast;\n\timage-rendering: pixelated;\n\t-ms-interpolation-mode: nearest-neighbor;\n":"","\n\n\tposition:absolute;\n\tmargin:auto;\n\ttop:0;\n\tleft:-1000%;\n\tright:-1000%;\n\tbottom:0;\n\n\t\t\t").concat(this.hideSource?" visibility: visible!important;":"","\n\t\t\t").concat(this.scaleMode===this.constructor.SCALE_MODES.MULTIPLES?"\n\ttransition:\n\t\twidth  0.2s cubic-bezier(0.22, 1.84, 0.88, 0.77),\n\t\theight 0.2s cubic-bezier(0.22, 1.84, 0.88, 0.77);":"","\n};");}},{key:"init",value:function(){this.size={x:this.source.width||this.source.style.width,y:this.source.height||this.source.style.height},this.size.x*=this.scaleMultiplier||1,this.size.y*=this.scaleMultiplier||1,this.ratio=this.size.x/this.size.y,this.insertStylesheet(),this.canvasContainer=document.createElement("div"),this.canvasContainer.id="canvasContainer",this.allowDownscaling||(this.canvasContainer.style.minWidth=this.size.x+"px",this.canvasContainer.style.minHeight=this.size.y+"px"),this.canvas=document.createElement("canvas"),this.canvas.id="outputCanvas",this.canvas.width=this.size.x,this.canvas.height=this.size.y,this.canvas.style.width=this.canvas.style.height=0,this.canvasContainer.appendChild(this.canvas),document.body.appendChild(this.canvasContainer);try{this.gl=new s(this.canvas),this.render=this.renderGL;}catch(t){console.warn("Falling back to canvas rendering: ",t),this.render=this.renderCanvas,this.canvas2d=this.canvas.getContext("2d");}this.gl&&(this.vertices=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),this.vertexBuffer=this.gl.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer),this.gl.bufferData(this.gl.ARRAY_BUFFER,this.vertices,this.gl.STATIC_DRAW),this.textureSource=new o(this.source,0,this.pixelate),this.disableFeedbackTexture||(this.textureFeedback=new o(this.canvas,1,this.pixelate)),this.setShader(this.vertex,this.fragment),this.gl.viewport(0,0,this.size.x,this.size.y),this.gl.clearColor(0,0,0,1)),window.onresize=this.onResize.bind(this),window.onresize(),this.disableMouseEvents||(this.canvas.onmousedown=this.onMouseEvent.bind(this),this.canvas.onmouseup=this.onMouseEvent.bind(this),this.canvas.onmousemove=this.onMouseEvent.bind(this),this.canvas.onmouseenter=this.onMouseEvent.bind(this),this.canvas.onmouseexit=this.onMouseEvent.bind(this),this.canvas.onmouseover=this.onMouseEvent.bind(this),this.canvas.onmouseout=this.onMouseEvent.bind(this),this.canvas.onmouseleave=this.onMouseEvent.bind(this),this.canvas.onclick=this.onMouseEvent.bind(this),this.canvas.ondblclick=this.onMouseEvent.bind(this),this.canvas.oncontextmenu=this.onMouseEvent.bind(this),this.canvas.ontouchstart=this.onTouchEvent.bind(this),this.canvas.ontouchend=this.onTouchEvent.bind(this),this.canvas.ontouchmove=this.onTouchEvent.bind(this),this.canvas.touchcancel=this.onTouchEvent.bind(this)),this.accumulator=0,"performance"in window?this.now=function(){return window.performance.now()}:this.now=function(){return window.Date.now()},"requestPostAnimationFrame"in window?this.requestAnimationFrame=function(t){window.requestPostAnimationFrame(t);}:"requestAnimationFrame"in window?this.requestAnimationFrame=function(t){window.requestAnimationFrame(t);}:this.requestAnimationFrame=function(t){setTimeout(t,-1);},this.startTime=this.now(),this.curTime=this.lastTime=0,this.main(this.curTime);}},{key:"setShader",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:r,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:a;this.program&&this.gl.deleteProgram(this.program),this.shader=new n(t,e),this.shader.useProgram(),this.glLocations={position:this.gl.getAttribLocation(this.shader.program,"position"),tex0:this.gl.getUniformLocation(this.shader.program,"tex0"),tex1:this.gl.getUniformLocation(this.shader.program,"tex1"),time:this.gl.getUniformLocation(this.shader.program,"time"),resolution:this.gl.getUniformLocation(this.shader.program,"resolution")},this.gl.uniform1i(this.glLocations.tex0,0),this.gl.uniform1i(this.glLocations.tex1,1),this.gl.uniform2f(this.glLocations.resolution,this.size.x,this.size.y),this.gl.enableVertexAttribArray(this.glLocations.position),this.gl.vertexAttribPointer(this.glLocations.position,2,this.gl.FLOAT,!1,0,0);}},{key:"renderCanvas",value:function(){this.canvas2d.clearRect(0,0,this.size.x,this.size.y),this.canvas2d.drawImage(this.source,0,0);}},{key:"renderGL",value:function(){this.textureSource.update(),this.gl.uniform1f(this.glLocations.time,this.curTime),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),this.shader.useProgram(),this.textureSource.bind(),this.disableFeedbackTexture||this.textureFeedback.bind(),this.gl.drawArrays(this.gl.TRIANGLES,0,this.vertices.length/2),this.disableFeedbackTexture||this.textureFeedback.update();}},{key:"onResize",value:function(){var t,e,i=this.canvasContainer.offsetWidth,s=this.canvasContainer.offsetHeight,n=i/s,o=this.constructor.SCALE_MODES,r=1;switch(n<this.ratio?s=Math.round(i/this.ratio):i=Math.round(s*this.ratio),this.scaleMode){case o.MULTIPLES:for(r=1,t=this.size.x,e=this.size.y;t+this.size.x<=i||e+this.size.y<=s;)t+=this.size.x,e+=this.size.y,r+=1;break;case o.FIT:t=i,e=s,r=i/this.size.x;break;case o.COVER:i=this.canvasContainer.offsetWidth,s=this.canvasContainer.offsetHeight,n<this.ratio?i=Math.round(s*this.ratio):s=Math.round(i/this.ratio),t=i,e=s,r=i/this.size.x;break;case o.NONE:r=1,t=this.size.x,e=this.size.y;}this._scale=this.scaleMultiplier*r,this.canvas.style.width=t+"px",this.canvas.style.height=e+"px";}},{key:"onMouseEvent",value:function(t){var e=this.canvas,i=this.source,s=e.offsetLeft+e.scrollLeft,n=e.offsetTop+e.scrollTop,o=i.offsetLeft+i.scrollLeft,r=i.offsetTop+i.scrollTop,a=1/this._scale,h=new MouseEvent(t.type,{screenX:(t.screenX-s)*a+o,screenY:(t.screenY-n)*a+r,clientX:(t.clientX-s)*a+o,clientY:(t.clientY-n)*a+r,altKey:t.altKey,shiftKey:t.shiftKey,metaKey:t.metaKey,button:t.button,buttons:t.buttons,relatedTarget:t.relatedTarget,region:t.region});i.dispatchEvent(h);}},{key:"onTouchEvent",value:function(t){var e=this.canvas,i=this.source,s=e.offsetLeft+e.scrollLeft,n=e.offsetTop+e.scrollTop,o=i.offsetLeft+i.scrollLeft,r=i.offsetTop+i.scrollTop,a=1/this._scale,h=function(t){return new Touch({identifier:t.identifier,force:t.force,rotationAngle:t.rotationAngle,target:t.target,radiusX:t.radiusX,radiusY:t.radiusY,pageX:(t.pageX-s)*a+o,pageY:(t.pageY-s)*a+o,screenX:(t.screenX-s)*a+o,screenY:(t.screenY-n)*a+r,clientX:(t.clientX-s)*a+o,clientY:(t.clientY-n)*a+r})},c=Array.from(t.touches).map(h),l=Array.from(t.targetTouches).map(h),u=Array.from(t.changedTouches).map(h),d=new t.constructor(t.type,{touches:c,targetTouches:l,changedTouches:u,ctrlKey:t.ctrlKey,shiftKey:t.shiftKey,altKey:t.altKey,metaKey:t.metaKey});i.dispatchEvent(d);}}]),e}();h.SCALE_MODES=Object.freeze({FIT:"FIT",COVER:"COVER",MULTIPLES:"MULTIPLES",NONE:"NONE"});

/**
 * Helper used to replace code in a script tag based on a search regex.
 * To inject code without erasing original string, using capturing groups; e.g.
 * ```js
 * inject(/(some string)/,'injected before $1 injected after');
 * ```
 * @param searcher Regex to search and replace
 * @param replacer Replacer string/fn
 */
function inject(searcher, replacer) {
    // find the relevant script tag
    var scriptTags = document.getElementsByTagName('script');
    var scriptTag;
    var code = '';
    for (var i = 0; i < scriptTags.length; ++i) {
        scriptTag = scriptTags[i];
        if (!scriptTag.textContent)
            continue;
        var matchesSearch = scriptTag.textContent.search(searcher) !== -1;
        var isCurrentScript = scriptTag === document.currentScript;
        if (matchesSearch && !isCurrentScript) {
            code = scriptTag.textContent;
            break;
        }
    }
    // error-handling
    if (!code || !scriptTag) {
        throw new Error('Couldn\'t find "' + searcher + '" in script tags');
    }
    // modify the content
    code = code.replace(searcher, replacer);
    // replace the old script tag with a new one using our modified code
    var newScriptTag = document.createElement('script');
    newScriptTag.textContent = code;
    scriptTag.insertAdjacentElement('afterend', newScriptTag);
    scriptTag.remove();
}
/**
 * Helper for getting an array with unique elements
 * @param  {Array} array Original array
 * @return {Array}       Copy of array, excluding duplicates
 */
function unique(array) {
    return array.filter(function (item, idx) {
        return array.indexOf(item) === idx;
    });
}
// Ex: inject(/(names.sprite.set\( name, id \);)/, '$1console.dir(names)');
/** test */
function kitsyInject(searcher, replacer) {
    if (!kitsy.queuedInjectScripts.some(function (script) {
        return searcher.toString() === script.searcher.toString() && replacer === script.replacer;
    })) {
        kitsy.queuedInjectScripts.push({
            searcher: searcher,
            replacer: replacer,
        });
    }
    else {
        console.warn('Ignored duplicate inject');
    }
}
// Ex: before('load_game', function run() { alert('Loading!'); });
//     before('show_text', function run(text) { return text.toUpperCase(); });
//     before('show_text', function run(text, done) { done(text.toUpperCase()); });
function before$1(targetFuncName, beforeFn) {
    kitsy.queuedBeforeScripts[targetFuncName] = kitsy.queuedBeforeScripts[targetFuncName] || [];
    kitsy.queuedBeforeScripts[targetFuncName].push(beforeFn);
}
// Ex: after('load_game', function run() { alert('Loaded!'); });
function after$1(targetFuncName, afterFn) {
    kitsy.queuedAfterScripts[targetFuncName] = kitsy.queuedAfterScripts[targetFuncName] || [];
    kitsy.queuedAfterScripts[targetFuncName].push(afterFn);
}
function applyInjects() {
    kitsy.queuedInjectScripts.forEach(function (injectScript) {
        inject(injectScript.searcher, injectScript.replacer);
    });
}
function applyHooks(root) {
    var allHooks = unique(Object.keys(kitsy.queuedBeforeScripts).concat(Object.keys(kitsy.queuedAfterScripts)));
    allHooks.forEach(applyHook.bind(this, root || window));
}
function applyHook(root, functionName) {
    var functionNameSegments = functionName.split('.');
    var obj = root;
    while (functionNameSegments.length > 1) {
        obj = obj[functionNameSegments.shift()];
    }
    var lastSegment = functionNameSegments[0];
    var superFn = obj[lastSegment];
    var superFnLength = superFn ? superFn.length : 0;
    var functions = [];
    // start with befores
    functions = functions.concat(kitsy.queuedBeforeScripts[functionName] || []);
    // then original
    if (superFn) {
        functions.push(superFn);
    }
    // then afters
    functions = functions.concat(kitsy.queuedAfterScripts[functionName] || []);
    // overwrite original with one which will call each in order
    obj[lastSegment] = function () {
        var returnVal;
        var args = [].slice.call(arguments);
        var i = 0;
        function runBefore() {
            // All outta functions? Finish
            if (i === functions.length) {
                return returnVal;
            }
            // Update args if provided.
            if (arguments.length > 0) {
                args = [].slice.call(arguments);
            }
            if (functions[i].length > superFnLength) {
                // Assume funcs that accept more args than the original are
                // async and accept a callback as an additional argument.
                return functions[i++].apply(this, args.concat(runBefore.bind(this)));
            }
            // run synchronously
            returnVal = functions[i++].apply(this, args);
            if (returnVal && returnVal.length) {
                args = returnVal;
            }
            return runBefore.apply(this, args);
        }
        return runBefore.apply(this, arguments);
    };
}
/**
@file kitsy-script-toolkit
@summary Monkey-patching toolkit to make it easier and cleaner to run code before and after functions or to inject new code into script tags
@license WTFPL (do WTF you want)
@author Original by mildmojo; modified by Sean S. LeBlanc
*/
var kitsy = (window.kitsy = window.kitsy || {
    queuedInjectScripts: [],
    queuedBeforeScripts: {},
    queuedAfterScripts: {},
    inject: kitsyInject,
    before: before$1,
    after: after$1,
    /**
     * Applies all queued `inject` calls.
     *
     * An object that instantiates an class modified via injection will still refer to the original class,
     * so make sure to reinitialize globals that refer to injected scripts before calling `applyHooks`.
     */
    applyInjects,
    /** Apples all queued `before`/`after` calls. */
    applyHooks,
});

if (!kitsy.hooked) {
	kitsy.hooked = true;
	const startOriginal = flickguy__default['default'].start;
	flickguy__default['default'].start = () => {
		kitsy.applyHooks(flickguy__default['default']);
		startOriginal.call(flickguy__default['default']);
	};
}

/** @see kitsy.inject */
kitsy.inject;
/** @see kitsy.before */
var before = kitsy.before;
/** @see kitsy.after */
var after = kitsy.after;

/** Adds a radio group if it does not exist
 * @param {string} title user-facing title of group
 * @param {string} id element id of group
 * @param {{ label, title, value }[]} options array of radio options
 * @param {(newValue) => void} onChange called when value changes
 */
function addRadioGroup(hackOptions, title, id, options, onChange) {
	before('Editor.prototype.init', function () {
		if (!document.getElementById(id)) {
			const container = document.createElement('div');
			container.style.display = 'flex';
			container.style.gap = '1em';
			const radioGroup = document.createElement('div');
			radioGroup.className = 'horizontal-capsule radio-select';
			radioGroup.id = id;
			radioGroup.title = title;
			radioGroup.style.flex = 'auto';

			options.forEach((option) => {
				const optionLabel = document.createElement('label');
				optionLabel.style.display = 'flex';
				optionLabel.style.alignItems = 'center';
				optionLabel.style.justifyContent = 'center';
				optionLabel.style.color = '#000';
				optionLabel.style.fontWeight = 'bold';
				const optionInput = document.createElement('input');
				optionInput.type = 'radio';
				optionInput.name = id;
				optionInput.value = option.value;
				optionInput.title = option.title;
				optionLabel.appendChild(optionInput);
				const optionName = document.createElement('span');
				optionName.textContent = option.label;
				optionName.style.position = 'relative';
				optionLabel.appendChild(optionName);
				radioGroup.appendChild(optionLabel);
			});
			container.appendChild(radioGroup);

			const about = document.createElement('button');
			about.textContent = '?';
			about.title = title + ' - non-standard flickguy feature, click to view source';
			about.style.flex = 'none';
			about.style.padding = '0.5em';
			about.dataset.hiddenInPlayer = true;
			about.onclick = () => {
				window.open(hackOptions.source, '_blank');
			};
			container.appendChild(about);

			document.getElementById('layer-options').insertAdjacentElement('afterend', container);
		}

		// init styles
		document.querySelectorAll(`#${id} span`).forEach((span) => { span.style.color = 'inherit'; });
		document.querySelector(`#${id} label:first-of-type input`).checked = true;
		document.querySelector(`#${id} label:first-of-type span`).style.color = '#FFF';
		// hook up listener
		const onInputChange = (event) => {
			document.querySelectorAll(`#${id} span`).forEach((span) => { span.style.color = 'inherit'; });
			event.currentTarget.nextSibling.style.color = '#FFF';
			onChange(event.currentTarget.value);
		};
		document.querySelectorAll(`#${id} input`).forEach((input) => { input.onchange = onInputChange; });
	});
}





const initialFilter = hackOptions.filters[0];
const renderer = document.querySelector('#renderer');
const glazy = new h({
	background: 'transparent',
	scaleMode: 'none',
	allowDownscaling: true,
	disableFeedbackTexture: false,
	hideSource: false,
	scaleMultiplier: initialFilter.scale,
	source: renderer,
	fragment: initialFilter.shader,
	autoInit: false,
});
const onChangeFilter = (idx) => {
	const filter = hackOptions.filters[idx];
	glazy.scaleMultiplier = filter.scale || 1;
	glazy.canvas.width = glazy.size.x = 128 * glazy.scaleMultiplier;
	glazy.canvas.height = glazy.size.y = 128 * glazy.scaleMultiplier;
	glazy.setShader(undefined, filter.shader);
	glazy.gl.viewport(0, 0, glazy.size.x, glazy.size.y);
	glazy.onResize();
};
before('Editor.prototype.init', function () {
	glazy.init();
	document.querySelector('style:last-of-type').remove();

	const container = renderer.parentElement;
	container.insertBefore(glazy.canvas, renderer);
	container.appendChild(glazy.canvasContainer);
	glazy.canvasContainer.parentElement.removeChild(glazy.canvasContainer);
	glazy.canvas.style.width = '512px';
	glazy.canvas.style.maxWidth = '100%';
	glazy.canvas.style.height = 'auto';
	glazy.canvas.style.position = 'absolute';
	glazy.canvas.style.pointerEvents = 'none';
});
before('Editor.prototype.exportImage', function () {
	flickguy__default['default'].exportScaleOriginal = flickguy__default['default'].exportScale;
	flickguy__default['default'].exportScale = Math.ceil(flickguy__default['default'].exportScaleOriginal / glazy.scaleMultiplier);
	this.renderingOriginal = this.rendering;
	glazy.render();
	this.rendering = { canvas: document.getElementById('outputCanvas') };
});
after('Editor.prototype.exportImage', function () {
	this.rendering = this.renderingOriginal;
	flickguy__default['default'].exportScale = flickguy__default['default'].exportScaleOriginal;
});

addRadioGroup(
	hackOptions,
	'filters',
	'shader-select',
	hackOptions.filters.map((i, idx) => ({
		label: i.name,
		title: 'filter: ' + i.name,
		value: idx,
	})),
	onChangeFilter,
);

exports.hackOptions = hackOptions;

Object.defineProperty(exports, '__esModule', { value: true });

}(this.hacks.filters = this.hacks.filters || {}, flickguy));
