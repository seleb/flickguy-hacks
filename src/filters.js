/**
📸
@file filters
@summary adds post-processing filters to flickguys
@license MIT
@version auto
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
import flickguy from 'flickguy';
import WebGLazy from 'webglazy';
import { after, before } from './helpers/kitsy-script-toolkit';
import { addRadioGroup } from './helpers/utils';

export const hackOptions = {
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
bool eq(vec4 A, vec4 B){
	return A.rgb==B.rgb;
}
bool neq(vec4 A, vec4 B){
	return A.rgb!=B.rgb;
}
void main(){
	vec2 coord = gl_FragCoord.xy;
	vec2 uv = coord.xy / resolution.xy;
	// subpixel determination
	vec2 fp = floor(3.0 * fract(uv*size));
	/*
		A B C		E0 E1 E2
		D E F		E3 E4 E5
		G H I		E6 E7 E8
	*/
	// reading the texels
	vec4 A = texture2D(tex0, uv + t1.xw);
	vec4 B = texture2D(tex0, uv + t1.yw);
	vec4 C = texture2D(tex0, uv + t1.zw);
	vec4 D = texture2D(tex0, uv + t2.xw);
	vec4 E = texture2D(tex0, uv + t2.yw);
	vec4 F = texture2D(tex0, uv + t2.zw);
	vec4 G = texture2D(tex0, uv + t3.xw);
	vec4 H = texture2D(tex0, uv + t3.yw);
	vec4 I = texture2D(tex0, uv + t3.zw);
	// equality checks
	bool eqBD = eq(B,D), eqBF = eq(B,F), eqHD = eq(H,D), eqHF = eq(H,F), neqEA = neq(E,A), neqEC = neq(E,C), neqEG = neq(E,G), neqEI = neq(E,I); 
	// rules
	vec4 E0 = eqBD ? B : E;
	vec4 E1 = eqBD && neqEC || eqBF && neqEA ? B : E;
	vec4 E2 = eqBF ? B : E;
	vec4 E3 = eqBD && neqEG || eqHD && neqEA ? D : E;
	vec4 E5 = eqBF && neqEI || eqHF && neqEC ? F : E;
	vec4 E6 = eqHD ? H : E;
	vec4 E7 = eqHD && neqEI || eqHF && neqEG ? H : E;
	vec4 E8 = eqHF ? H : E;
	// general condition & subpixel output
	gl_FragColor = neq(B,H) && neq(D,F) ? (fp.y == 0. ? (fp.x == 0. ? E0 : fp.x == 1. ? E1 : E2) : (fp.y == 1. ? (fp.x == 0. ? E3 : fp.x == 1. ? E : E5) : (fp.x == 0. ? E6 : fp.x == 1. ? E7 : E8))) : E;
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

const initialFilter = hackOptions.filters[0];
const renderer = document.querySelector('#renderer');
const glazy = new WebGLazy({
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
before('Editor.prototype.init', function () {
	glazy.init();
	glazy.canvas.dataset.editorOnly = true;
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

	addRadioGroup(
		hackOptions,
		'filters',
		'shader-select',
		hackOptions.filters.map((i, idx) => ({
			label: i.name,
			title: 'filter: ' + i.name,
			value: idx,
		})),
		function (idx) {
			const filter = hackOptions.filters[idx];
			glazy.scaleMultiplier = filter.scale || 1;
			glazy.canvas.width = glazy.size.x = 128 * glazy.scaleMultiplier;
			glazy.canvas.height = glazy.size.y = 128 * glazy.scaleMultiplier;
			glazy.setShader(undefined, filter.shader);
			glazy.gl.viewport(0, 0, glazy.size.x, glazy.size.y);
			glazy.onResize();
		},
	);
});
before('Editor.prototype.exportImage', function () {
	flickguy.exportScaleOriginal = flickguy.exportScale;
	flickguy.exportScale = Math.ceil(flickguy.exportScaleOriginal / glazy.scaleMultiplier);
	this.renderingOriginal = this.rendering;
	glazy.render();
	this.rendering = { canvas: document.getElementById('outputCanvas') };
});
after('Editor.prototype.exportImage', function () {
	this.rendering = this.renderingOriginal;
	flickguy.exportScale = flickguy.exportScaleOriginal;
});
