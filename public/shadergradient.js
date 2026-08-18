export class ShaderGradient {
  constructor(canvas, options = {}) {
    if (!canvas) return;
    this.canvas = canvas;
    this.options = Object.assign({
      animate: 'on', bgColor1: '#000000', bgColor2: '#000000', brightness: 1.2,
      color1: '#6164ff', color2: '#7a36c7', color3: '#ea9dfd', pixelDensity: 1,
      rotationZ: 225, uDensity: 1.8, uFrequency: 5.5, uSpeed: 0.2,
      uStrength: 3, uTime: 0.2
    }, options);
    this.gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!this.gl) return;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.start = performance.now() - this.options.uTime * 1000;
    this.build();
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas.parentElement || canvas);
    this.resize();
    requestAnimationFrame(this.render);
  }

  hex(value) {
    const n = parseInt(value.replace('#', ''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  shader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  build() {
    const gl = this.gl;
    const vertex = `attribute vec2 p; varying vec2 vUv; void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
    const fragment = `precision highp float;
      varying vec2 vUv;
      uniform vec2 resolution;
      uniform float time, density, frequency, strength, rotation, brightness;
      uniform vec3 color1, color2, color3, bg1, bg2;
      float softWave(vec2 p,float phase){
        return sin(p.x*frequency+p.y*1.35+phase)+.55*sin(p.x*frequency*.54-p.y*2.1-phase*.73)+.28*cos(p.y*frequency*.42+phase*.46);
      }
      void main(){
        vec2 uv=vUv;
        vec2 p=uv-.5;
        p.x*=resolution.x/resolution.y;
        float a=radians(rotation);
        p=mat2(cos(a),-sin(a),sin(a),cos(a))*p;
        float horizon=smoothstep(-.82,.78,p.y);
        float perspective=mix(1.65,.68,horizon);
        vec2 q=vec2(p.x*perspective,p.y)*density;
        float w1=softWave(q,time);
        float w2=softWave(q*1.34+vec2(w1*.09,-w1*.045),-time*.74+2.1);
        float flow=.5+.5*sin((w1*.62+w2*.42)*strength*.58+q.x*.72-time*.34);
        float bands=.5+.5*cos((q.y+w1*.075)*frequency*.92-time*.52);
        float blend=smoothstep(.08,.92,flow*.72+bands*.28);
        vec3 col=mix(color1,color2,smoothstep(.08,.76,blend));
        col=mix(col,color3,smoothstep(.58,1.,flow)*(.42+.34*bands));
        float glow=exp(-3.2*abs(q.y*.34+w1*.07-.08));
        col+=color3*glow*.18;
        float edge=smoothstep(1.05,.15,length(p*vec2(.72,1.05)));
        vec3 bg=mix(bg1,bg2,uv.y);
        col=mix(bg,col,edge*.97);
        col*=brightness;
        gl_FragColor=vec4(col,1.);
      }`;
    const program = gl.createProgram();
    gl.attachShader(program, this.shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, this.shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    gl.useProgram(program);
    this.program = program;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const p = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    const set3 = (name, value) => gl.uniform3fv(gl.getUniformLocation(program, name), this.hex(value));
    set3('color1', this.options.color1); set3('color2', this.options.color2); set3('color3', this.options.color3);
    set3('bg1', this.options.bgColor1); set3('bg2', this.options.bgColor2);
    gl.uniform1f(gl.getUniformLocation(program, 'density'), this.options.uDensity);
    gl.uniform1f(gl.getUniformLocation(program, 'frequency'), this.options.uFrequency);
    gl.uniform1f(gl.getUniformLocation(program, 'strength'), this.options.uStrength);
    gl.uniform1f(gl.getUniformLocation(program, 'rotation'), this.options.rotationZ);
    gl.uniform1f(gl.getUniformLocation(program, 'brightness'), this.options.brightness);
    this.timeLocation = gl.getUniformLocation(program, 'time');
    this.resolutionLocation = gl.getUniformLocation(program, 'resolution');
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, this.options.pixelDensity || 1);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
  }

  render(now) {
    const moving = this.options.animate === 'on' && !this.reducedMotion;
    const elapsed = moving ? (now - this.start) / 1000 * this.options.uSpeed : this.options.uTime;
    this.gl.uniform1f(this.timeLocation, elapsed);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    requestAnimationFrame(this.render);
  }
}
