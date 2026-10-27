'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRightIcon,
  BotIcon,
  CheckIcon,
  FileTextIcon,
  Globe2Icon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  TargetIcon,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const products = [
  {
    title: 'AI Keyword Research',
    description:
      'Turn one keyword into a focused view of cited sources, competitors, content gaps, customer prompts, and related topic groups.',
    action: 'Research a keyword',
    icon: SearchIcon,
    preview: 'keyword' as const,
  },
  {
    title: 'AI Search Visibility',
    description:
      'See whether ChatGPT and Gemini mention your brand, cite your website, and surface competitors for real customer questions.',
    action: 'Check brand visibility',
    icon: BotIcon,
    preview: 'visibility' as const,
  },
  {
    title: 'Persistent Reports',
    description:
      'Keep completed keyword and visibility research in one history, ready to reopen whenever your team needs the evidence.',
    action: 'Create your workspace',
    icon: FileTextIcon,
    preview: 'reports' as const,
  },
];

const audiences = [
  {
    title: 'Content marketers',
    copy: 'Find useful content angles, question patterns, source gaps, and prompt opportunities before committing to a brief.',
    points: [
      'Prioritize topic opportunities',
      'See which formats earn citations',
      'Turn questions into briefs',
    ],
    icon: SearchIcon,
  },
  {
    title: 'SEO consultants',
    copy: 'Give clients a focused view of organic opportunity and AI visibility without burying the decision in dashboard noise.',
    points: [
      'Compare relevant competitors',
      'Explain mention patterns',
      'Keep every report available',
    ],
    icon: TargetIcon,
  },
  {
    title: 'Brand teams',
    copy: 'Understand how AI platforms describe the brand, which prompts surface it, and who appears in the same answers.',
    points: [
      'Check ChatGPT and Gemini',
      'Separate mentions from citations',
      'Find gaps by prompt',
    ],
    icon: Globe2Icon,
  },
];

const testimonialPreviews = [
  {
    role: 'Content marketer',
    focus: 'Planning',
    initials: 'CM',
    body: 'Turn one keyword into a focused brief with clearer angles, sources, and customer questions.',
  },
  {
    role: 'SEO consultant',
    focus: 'Client strategy',
    initials: 'SC',
    body: 'Explain the opportunity without presenting directional research as search-volume or ranking data.',
  },
  {
    role: 'Brand lead',
    focus: 'AI visibility',
    initials: 'BL',
    body: 'See which customer prompts surface the brand and which competitors appear in the same answers.',
  },
  {
    role: 'Growth marketer',
    focus: 'Prioritization',
    initials: 'GM',
    body: 'Move from a broad topic to specific content opportunities the team can prioritize next.',
  },
  {
    role: 'Agency strategist',
    focus: 'Reporting',
    initials: 'AS',
    body: 'Keep keyword and visibility findings in one report history that is easy to reopen and discuss.',
  },
  {
    role: 'Content lead',
    focus: 'Evidence',
    initials: 'CL',
    body: 'Understand which source patterns shape the answer before deciding what the next page should cover.',
  },
];

const HeroShader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const vertexSource = `
      attribute vec2 a_position;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;

      uniform vec2 u_resolution;
      uniform vec2 u_pointer;
      uniform float u_time;

      float hash(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 local = fract(point);
        local = local * local * (3.0 - 2.0 * local);

        return mix(
          mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
          mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
          local.y
        );
      }

      float fbm(vec2 point) {
        float value = 0.0;
        float amplitude = 0.5;
        mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);

        for (int octave = 0; octave < 4; octave++) {
          value += amplitude * noise(point);
          point = rotation * point * 2.02 + 0.17;
          amplitude *= 0.5;
        }

        return value;
      }

      void main() {
        vec2 screen = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        vec2 uv = (screen - 0.5) * vec2(aspect, 1.0);
        vec2 pointer = (u_pointer - 0.5) * vec2(aspect, 1.0);
        float time = u_time * 0.16;

        float firstFlow = fbm(uv * 1.75 + vec2(time, -time * 0.72));
        float secondFlow = fbm(uv * 3.2 - vec2(time * 0.42, time * 0.25) + firstFlow);
        float ribbon = sin((uv.x + firstFlow * 0.52) * 7.0 - time * 2.2) * 0.5 + 0.5;
        float pointerLight = exp(-4.2 * length(uv - pointer));
        float field = smoothstep(0.18, 0.92, firstFlow * 0.54 + secondFlow * 0.28 + ribbon * 0.24 + pointerLight * 0.34);

        vec3 nightGreen = vec3(0.008, 0.070, 0.030);
        vec3 rankGreen = vec3(0.000, 0.390, 0.155);
        vec3 mint = vec3(0.170, 0.920, 0.510);
        vec3 color = mix(nightGreen, rankGreen, field);
        color = mix(color, mint, pow(pointerLight * 0.72 + ribbon * 0.12, 2.4));

        float vignette = smoothstep(1.08, 0.18, length(uv));
        color *= 0.62 + vignette * 0.38;
        color += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.022;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const pointerLocation = gl.getUniformLocation(program, 'u_pointer');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const pointer = { x: 0.72, y: 0.58 };
    const pointerTarget = { x: 0.72, y: 0.58 };
    let bounds = canvas.getBoundingClientRect();
    let frameId = 0;
    let lastFrameTime = 0;
    let inViewport = true;
    let pageVisible = !document.hidden;

    const resize = () => {
      bounds = canvas.getBoundingClientRect();
      const renderScale = bounds.width < 768 ? 0.65 : 0.72;
      const pixelRatio = Math.min(window.devicePixelRatio, 1.25) * renderScale;
      const width = Math.max(1, Math.floor(bounds.width * pixelRatio));
      const height = Math.max(1, Math.floor(bounds.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const draw = (time: number) => {
      pointer.x += (pointerTarget.x - pointer.x) * 0.08;
      pointer.y += (pointerTarget.y - pointer.y) * 0.08;
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(pointerLocation, pointer.x, pointer.y);
      gl.uniform1f(timeLocation, time * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = (time: number) => {
      frameId = window.requestAnimationFrame(render);
      if (time - lastFrameTime < 1000 / 30) return;
      lastFrameTime = time;
      draw(time);
    };
    const startRendering = () => {
      if (reducedMotion || frameId !== 0 || !inViewport || !pageVisible) return;
      lastFrameTime = 0;
      frameId = window.requestAnimationFrame(render);
    };
    const stopRendering = () => {
      if (frameId === 0) return;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!inViewport || bounds.width === 0 || bounds.height === 0) return;
      pointerTarget.x = Math.min(
        1,
        Math.max(0, (event.clientX - bounds.left) / bounds.width),
      );
      pointerTarget.y =
        1 -
        Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    };
    const handleVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (pageVisible) startRendering();
      else stopRendering();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(0);
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) startRendering();
      else stopRendering();
    });

    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    if (!reducedMotion)
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resize();
    if (reducedMotion) draw(0);
    else startRendering();

    return () => {
      stopRendering();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 size-full'
    />
  );
};

const ThreeDimensionalTestimonials = () => {
  return (
    <div className='relative h-135 overflow-hidden rounded-[16px] border bg-primary/5 perspective-[950px] sm:h-155'>
      <div className='absolute left-1/2 top-1/2 flex w-max -translate-x-1/2 -translate-y-1/2 gap-4 transform-[translateX(-70px)_translateY(0)_translateZ(-120px)_rotateX(18deg)_rotateY(-10deg)_rotateZ(8deg)_scale(1.08)] transform-3d'>
        {[0, 1, 2, 3].map((column) => (
          <div
            key={column}
            data-direction={column % 2 === 0 ? 'forward' : 'reverse'}
            className='landing-testimonial-column flex w-64 shrink-0 flex-col will-change-transform'
          >
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className='flex flex-col gap-4 pb-4'
              >
                {testimonialPreviews.map((testimonial) => (
                  <article
                    key={`${column}-${copy}-${testimonial.role}`}
                    className='rounded-[14px] border bg-background p-5 shadow-[0_16px_45px_rgba(20,50,29,0.08)]'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
                        {testimonial.initials}
                      </span>
                      <div>
                        <p className='text-sm font-bold'>{testimonial.role}</p>
                        <p className='text-xs text-muted-foreground'>
                          {testimonial.focus}
                        </p>
                      </div>
                    </div>
                    <p className='mt-5 text-sm leading-6 text-foreground/72'>
                      {testimonial.body}
                    </p>
                  </article>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className='pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-muted to-transparent' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-muted to-transparent' />
      <div className='pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-muted to-transparent sm:w-40' />
      <div className='pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-muted to-transparent sm:w-40' />
    </div>
  );
};

const KeywordPreview = ({ dark = false }: { dark?: boolean }) => {
  const surface = dark
    ? 'border-white/10 bg-white/5 text-background'
    : 'border-border bg-background text-foreground';
  const muted = dark ? 'text-background/50' : 'text-muted-foreground';

  return (
    <div className={`overflow-hidden rounded-[14px] border ${surface}`}>
      <div className='flex items-center justify-between border-b border-current/10 px-5 py-4'>
        <div>
          <p className='font-semibold'>Keyword opportunity</p>
          <p className={`mt-1 text-xs ${muted}`}>Evidence-led topic research</p>
        </div>
        <span className='rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary'>
          Promising
        </span>
      </div>
      <div className='grid gap-6 p-5 sm:grid-cols-[0.8fr_1.2fr] sm:p-6'>
        <div className='rounded-[12px] border border-current/10 p-5'>
          <p className={`text-xs font-medium ${muted}`}>Overall opportunity</p>
          <div className='mt-6 flex items-end gap-1.5' aria-hidden='true'>
            {[28, 40, 34, 58, 75, 88].map((height) => (
              <span
                key={height}
                className='w-full rounded-t-sm bg-primary'
                style={{ height, opacity: 0.35 + height / 140 }}
              />
            ))}
          </div>
        </div>
        <div className='space-y-5'>
          {['Content gaps', 'Source patterns', 'Customer questions'].map(
            (label, index) => (
              <div key={label}>
                <div
                  className={`mb-2 flex justify-between gap-4 text-xs ${muted}`}
                >
                  <span>{label}</span>
                  <span>Clear signal</span>
                </div>
                <div
                  className={
                    dark
                      ? 'h-2 rounded-full bg-white/10'
                      : 'h-2 rounded-full bg-muted'
                  }
                >
                  <div
                    className='h-full rounded-full bg-primary'
                    style={{ width: `${78 - index * 13}%` }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

const VisibilityPreview = ({ dark = false }: { dark?: boolean }) => {
  const surface = dark
    ? 'border-white/10 bg-white/5 text-background'
    : 'border-border bg-background text-foreground';
  const muted = dark ? 'text-background/50' : 'text-muted-foreground';

  return (
    <div className={`overflow-hidden rounded-[14px] border ${surface}`}>
      <div className='flex items-center justify-between border-b border-current/10 px-5 py-4'>
        <div>
          <p className='font-semibold'>Brand visibility</p>
          <p className={`mt-1 text-xs ${muted}`}>Answer-by-answer evidence</p>
        </div>
        <Globe2Icon className='size-4 text-primary' />
      </div>
      <div className='grid grid-cols-2'>
        {['ChatGPT', 'Gemini'].map((platform, platformIndex) => (
          <div
            key={platform}
            className={`p-5 ${platformIndex === 0 ? 'border-r border-current/10' : ''}`}
          >
            <p className='flex items-center gap-2 text-sm font-semibold'>
              <span className='size-2 rounded-full bg-primary' />
              {platform}
            </p>
            <div className='mt-6 space-y-4'>
              {['Brand mentions', 'Domain citations'].map((label, index) => (
                <div key={label}>
                  <p className={`mb-2 text-[11px] ${muted}`}>{label}</p>
                  <div
                    className={
                      dark
                        ? 'h-2 rounded-full bg-white/10'
                        : 'h-2 rounded-full bg-muted'
                    }
                  >
                    <div
                      className='h-full rounded-full bg-primary'
                      style={{
                        width: `${72 - platformIndex * 14 - index * 16}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsPreview = () => {
  return (
    <div className='overflow-hidden rounded-[14px] border bg-background'>
      <div className='flex items-center justify-between border-b px-5 py-4'>
        <div>
          <p className='font-semibold'>Recent reports</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            One research history
          </p>
        </div>
        <FileTextIcon className='size-4 text-primary' />
      </div>
      <div className='divide-y px-5'>
        {[
          'AI SEO tools',
          'BrandRadar visibility',
          'Content research platforms',
        ].map((title) => (
          <div key={title} className='flex items-center gap-4 py-4'>
            <span className='flex size-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary'>
              <CheckIcon className='size-4' />
            </span>
            <p className='min-w-0 flex-1 truncate text-sm font-semibold'>
              {title}
            </p>
            <span className='text-xs font-semibold text-primary'>Ready</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkspacePreview = () => {
  return (
    <div className='overflow-hidden rounded-[16px] border border-foreground/10 bg-muted text-foreground shadow-[0_30px_90px_rgba(0,0,0,0.18)]'>
      <div className='flex h-12 items-center border-b bg-background px-4'>
        <div className='flex gap-1.5' aria-hidden='true'>
          <span className='size-2 rounded-full bg-destructive' />
          <span className='size-2 rounded-full bg-warning' />
          <span className='size-2 rounded-full bg-primary' />
        </div>
        <p className='mx-auto font-mono text-[10px] text-muted-foreground sm:text-xs'>
          BrandRadar research workspace
        </p>
      </div>
      <div className='grid md:grid-cols-[150px_1fr]'>
        <aside className='hidden border-r bg-background p-4 md:block'>
          <p className='font-bold'>BrandRadar</p>
          <div className='mt-7 space-y-2 text-xs'>
            {['Overview', 'Sources', 'Competitors', 'Prompts'].map(
              (label, index) => (
                <div
                  key={label}
                  className={
                    index === 0
                      ? 'rounded-[8px] bg-primary/10 px-3 py-2.5 font-semibold text-primary'
                      : 'px-3 py-2.5 text-muted-foreground'
                  }
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </aside>
        <div className='p-3 sm:p-5'>
          <div className='rounded-[14px] border bg-background p-4 sm:p-6'>
            <div className='flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>
                  AI Keyword Research
                </p>
                <h3 className='mt-1 text-xl font-bold'>AI SEO tools</h3>
              </div>
              <span className='w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary'>
                Report ready
              </span>
            </div>
            <div className='mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]'>
              <KeywordPreview />
              <div className='rounded-[14px] border p-5'>
                <p className='text-sm font-semibold'>Next best actions</p>
                <div className='mt-5 space-y-4'>
                  {[
                    'Answer missing questions',
                    'Strengthen cited evidence',
                    'Cover comparison intent',
                  ].map((item) => (
                    <p
                      key={item}
                      className='flex gap-3 text-xs leading-5 text-muted-foreground'
                    >
                      <CheckIcon className='mt-0.5 size-3.5 shrink-0 text-primary' />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  const [activeProduct, setActiveProduct] = useState(0);
  const [activeAudience, setActiveAudience] = useState(0);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-hero-reveal]', {
          y: 36,
          opacity: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power3.out',
        });
        gsap.from('[data-hero-line]', {
          yPercent: 108,
          rotate: 1.5,
          duration: 1.05,
          stagger: 0.1,
          ease: 'power4.out',
        });
        gsap.to('[data-hero-copy]', {
          y: -28,
          opacity: 0.7,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-hero]',
            start: 'top top',
            end: '55% top',
            scrub: 0.8,
          },
        });
        gsap.to('[data-hero-preview]', {
          y: 76,
          scale: 0.96,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-hero]',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
        gsap.utils
          .toArray<HTMLElement>('[data-scale-visual]')
          .forEach((visual) => {
            gsap.fromTo(
              visual,
              { scale: 0.88, opacity: 0.35 },
              {
                scale: 1,
                opacity: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: visual,
                  start: 'top 88%',
                  end: 'center 55%',
                  scrub: 0.7,
                },
              },
            );
          });
        gsap.from('[data-stack-card]', {
          y: 70,
          scale: 0.96,
          opacity: 0,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '[data-stack-grid]',
            start: 'top 78%',
            end: 'center 58%',
            scrub: 0.7,
          },
        });
      });

      return () => media.revert();
    },
    { scope: pageRef },
  );

  const preview = products[activeProduct].preview;

  return (
    <>
      <main
        ref={pageRef}
        className='w-full max-w-full overflow-x-hidden bg-background'
      >
        <section
          data-hero
          className='relative min-h-230 overflow-hidden bg-primary text-primary-foreground'
        >
          <Header />
          <HeroShader />
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-linear-to-b from-foreground/5 via-transparent to-foreground/20'
          />
          <div className='relative mx-auto flex w-full max-w-335 flex-col px-4 pt-36 sm:px-6 lg:px-8 lg:pt-44'>
            <div data-hero-copy className='max-w-6xl will-change-transform'>
              <p
                data-hero-reveal
                className='text-sm font-semibold text-primary-foreground/70'
              >
                Focused research for search and AI visibility.
              </p>
              <h1 className='mt-5 max-w-6xl text-[clamp(3rem,6vw,5.75rem)] font-extrabold leading-[0.94] tracking-[-0.055em] text-balance'>
                <span className='block overflow-hidden pb-[0.06em]'>
                  <span data-hero-line className='block will-change-transform'>
                    Know what to rank for.
                  </span>
                </span>
                <span className='block overflow-hidden pb-[0.08em]'>
                  <span data-hero-line className='block will-change-transform'>
                    See where AI finds you.
                  </span>
                </span>
              </h1>
              <p
                data-hero-reveal
                className='mt-7 max-w-2xl text-base leading-7 text-primary-foreground/72 sm:text-lg sm:leading-8'
              >
                BrandRadar turns a keyword or brand into a clear research report,
                so you can choose what to publish and understand how ChatGPT and
                Gemini represent you.
              </p>
              <div data-hero-reveal className='mt-9 flex flex-wrap gap-3'>
                <Button
                  render={<Link href='/auth/sign-up' />}
                  nativeButton={false}
                  size='lg'
                  className='group/hero-primary h-13 gap-4 rounded-[9px] border-primary-foreground bg-primary-foreground py-1.5 pr-1.5 pl-5 text-sm font-bold tracking-normal text-primary normal-case shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-foreground hover:shadow-[0_14px_36px_rgba(0,0,0,0.24)] active:translate-y-px'
                >
                  Start researching for free
                  <span className='flex size-10 items-center justify-center rounded-[7px] bg-primary text-primary-foreground'>
                    <ArrowRightIcon className='size-4 transition-transform duration-300 ease-out group-hover/hero-primary:translate-x-1' />
                  </span>
                </Button>
                <Button
                  render={<Link href='#products' />}
                  nativeButton={false}
                  size='lg'
                  variant='outline'
                  className='group/hero-secondary h-13 gap-2 rounded-[9px] border-primary-foreground/35 bg-foreground/10 px-5 text-sm font-semibold tracking-normal text-primary-foreground normal-case backdrop-blur-sm transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary-foreground/55 hover:bg-primary-foreground/10 hover:text-primary-foreground active:translate-y-px'
                >
                  Explore the reports
                  <ArrowRightIcon className='size-4 transition-transform duration-300 ease-out group-hover/hero-secondary:translate-x-1' />
                </Button>
              </div>
            </div>
            <div
              data-hero-reveal
              data-hero-preview
              className='mt-20 w-full max-w-6xl origin-bottom will-change-transform lg:mt-24'
            >
              <WorkspacePreview />
            </div>
          </div>
        </section>

        <section
          aria-label='Research sources'
          className='overflow-hidden border-b bg-background py-5'
        >
          <div className='landing-marquee flex w-max motion-reduce:animate-none'>
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className='flex shrink-0 items-center'
              >
                {[
                  'Collected evidence',
                  'ChatGPT',
                  'Gemini',
                  'Cited domains',
                  'Customer prompts',
                ].map((signal) => (
                  <div
                    key={`${copy}-${signal}`}
                    className='flex items-center gap-4 px-8 text-sm font-semibold text-muted-foreground sm:px-12'
                  >
                    <span className='size-1.5 rounded-full bg-primary' />
                    {signal}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section
          id='products'
          className='mx-auto w-full max-w-350 px-4 py-32 sm:px-6 md:py-44 lg:px-8'
        >
          <h2 className='max-w-4xl text-[clamp(2.6rem,5vw,5rem)] font-bold leading-[0.96] tracking-tighter'>
            Your research workspace—built for search and AI.
          </h2>
          <div className='mt-16 grid gap-12 lg:grid-cols-12 lg:items-start'>
            <div className='lg:col-span-5'>
              {products.map((product, index) => {
                const Icon = product.icon;
                const active = activeProduct === index;
                return (
                  <div key={product.title} className='border-t last:border-b'>
                    <button
                      type='button'
                      onClick={() => setActiveProduct(index)}
                      aria-expanded={active}
                      className='flex min-h-20 w-full items-center gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                    >
                      <span
                        className={
                          active
                            ? 'flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground'
                            : 'flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground'
                        }
                      >
                        {active ? (
                          <MinusIcon className='size-4' />
                        ) : (
                          <PlusIcon className='size-4' />
                        )}
                      </span>
                      <Icon
                        className={
                          active
                            ? 'size-5 text-primary'
                            : 'size-5 text-muted-foreground'
                        }
                      />
                      <span
                        className={
                          active
                            ? 'text-xl font-bold'
                            : 'text-xl font-semibold text-muted-foreground'
                        }
                      >
                        {product.title}
                      </span>
                    </button>
                    {active && (
                      <div className='pb-7 pl-11'>
                        <p className='max-w-md leading-7 text-muted-foreground'>
                          {product.description}
                        </p>
                        <Link
                          href='/auth/sign-up'
                          className='mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline'
                        >
                          {product.action}
                          <ArrowRightIcon className='size-4' />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className='group overflow-hidden rounded-[16px] border bg-muted/45 p-4 lg:col-span-7 lg:p-8'>
              <div className='transition-transform duration-700 ease-out group-hover:scale-[1.02]'>
                {preview === 'keyword' && <KeywordPreview />}
                {preview === 'visibility' && <VisibilityPreview />}
                {preview === 'reports' && <ReportsPreview />}
              </div>
            </div>
          </div>
        </section>

        <section className='bg-foreground text-background'>
          <div className='mx-auto w-full max-w-350 px-4 py-32 sm:px-6 md:py-44 lg:px-8'>
            <div className='grid gap-8 lg:grid-cols-12 lg:items-end'>
              <h2 className='max-w-5xl text-[clamp(2.6rem,5vw,5rem)] font-bold leading-[0.96] tracking-tighter lg:col-span-8'>
                Turn scattered signals into one clear direction.
              </h2>
              <p className='max-w-md text-lg leading-8 text-background/55 lg:col-span-4'>
                Start with a question. BrandRadar organizes the useful findings
                around decisions you can make next.
              </p>
            </div>
            <div
              data-stack-grid
              className='mt-16 grid grid-flow-dense gap-4 lg:grid-cols-12 lg:grid-rows-2'
            >
              <Link
                data-stack-card
                href='/auth/sign-up'
                className='group overflow-hidden rounded-[14px] border border-white/10 bg-primary p-6 text-primary-foreground focus-visible:ring-2 focus-visible:ring-background lg:col-span-7 lg:row-span-2 sm:p-9'
              >
                <div className='flex items-start justify-between gap-8'>
                  <div>
                    <SearchIcon className='size-6' />
                    <h3 className='mt-7 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl'>
                      Find the angle other pages leave open.
                    </h3>
                  </div>
                  <ArrowRightIcon className='size-6 shrink-0 transition-transform group-hover:translate-x-1' />
                </div>
                <p className='mt-5 max-w-xl leading-7 text-primary-foreground/72'>
                  Explore competitors, source patterns, content opportunities,
                  customer prompts, and related topics from collected evidence.
                </p>
                <div className='mt-12 rounded-[14px] bg-foreground p-3 sm:mt-16 sm:p-5'>
                  <KeywordPreview dark />
                </div>
              </Link>
              <Link
                data-stack-card
                href='/auth/sign-up'
                className='group overflow-hidden rounded-[14px] border border-white/10 bg-white/5 p-6 focus-visible:ring-2 focus-visible:ring-background lg:col-span-5 sm:p-8'
              >
                <BotIcon className='size-5 text-primary' />
                <h3 className='mt-5 text-2xl font-bold tracking-tight'>
                  See where your brand appears in AI answers.
                </h3>
                <div className='mt-7'>
                  <VisibilityPreview dark />
                </div>
              </Link>
              <Link
                data-stack-card
                href='/auth/sign-up'
                className='group flex min-h-64 rounded-[14px] border border-white/10 bg-background p-6 text-foreground focus-visible:ring-2 focus-visible:ring-background lg:col-span-5 sm:p-8'
              >
                <div className='flex w-full flex-col justify-between'>
                  <div className='flex justify-between'>
                    <FileTextIcon className='size-5 text-primary' />
                    <ArrowRightIcon className='size-5 transition-transform group-hover:translate-x-1' />
                  </div>
                  <div>
                    <h3 className='text-2xl font-bold tracking-tight'>
                      Keep every completed report within reach.
                    </h3>
                    <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                      Reopen keyword and visibility research from one focused
                      history.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className='bg-foreground text-background'>
          <div className='mx-auto grid w-full max-w-350 gap-16 px-4 pb-32 sm:px-6 md:pb-44 lg:grid-cols-12 lg:px-8'>
            <div className='lg:col-span-5'>
              <div className='lg:sticky lg:top-28'>
                <p className='font-semibold text-primary'>
                  Two focused research products.
                </p>
                <h2 className='mt-5 max-w-xl text-[clamp(2.6rem,5vw,4.75rem)] font-bold leading-[0.96] tracking-tighter'>
                  Read the market from both sides.
                </h2>
                <p className='mt-6 max-w-md text-lg leading-8 text-background/55'>
                  Understand what people are researching, then see how AI
                  answers position your brand inside that conversation.
                </p>
              </div>
            </div>
            <div className='space-y-28 lg:col-span-7 lg:space-y-40'>
              <article className='border-t border-white/10 pt-8'>
                <p className='text-sm font-semibold text-primary'>
                  AI Keyword Research
                </p>
                <h3 className='mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl'>
                  Build a content direction from collected evidence.
                </h3>
                <p className='mt-5 max-w-xl leading-7 text-background/55'>
                  Start with a keyword and receive a structured view of
                  competitors, sources, prompts, and related topic groups.
                </p>
                <div data-scale-visual className='mt-10 origin-center'>
                  <KeywordPreview dark />
                </div>
              </article>
              <article className='border-t border-white/10 pt-8'>
                <p className='text-sm font-semibold text-primary'>
                  AI Search Visibility
                </p>
                <h3 className='mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl'>
                  See which answers include you—and which do not.
                </h3>
                <p className='mt-5 max-w-xl leading-7 text-background/55'>
                  Compare brand mentions and audited-domain citations across
                  ChatGPT and Gemini, prompt by prompt.
                </p>
                <div data-scale-visual className='mt-10 origin-center'>
                  <VisibilityPreview dark />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className='mx-auto w-full max-w-350 px-4 py-32 sm:px-6 md:py-44 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-12 lg:items-end'>
            <h2 className='max-w-4xl text-[clamp(2.6rem,5vw,4.75rem)] font-bold leading-[0.96] tracking-tighter lg:col-span-8'>
              Whatever your role, start with the evidence you need.
            </h2>
            <p className='max-w-md text-lg leading-8 text-muted-foreground lg:col-span-4'>
              Choose the perspective closest to your work and see how BrandRadar
              supports the decision.
            </p>
          </div>
          <div className='mt-16 flex flex-col gap-3 lg:min-h-105 lg:flex-row'>
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              const active = activeAudience === index;
              return (
                <article
                  key={audience.title}
                  onMouseEnter={() => setActiveAudience(index)}
                  className={
                    active
                      ? 'flex-[1.85] rounded-[14px] border bg-foreground p-6 text-background transition-[flex] duration-500 lg:p-8'
                      : 'flex-1 rounded-[14px] border bg-muted/50 p-6 transition-[flex] duration-500 lg:p-8'
                  }
                >
                  <button
                    type='button'
                    onClick={() => setActiveAudience(index)}
                    aria-pressed={active}
                    className='flex min-h-11 w-full items-start justify-between gap-5 text-left focus-visible:ring-2 focus-visible:ring-primary'
                  >
                    <span className='text-xl font-bold sm:text-2xl'>
                      {audience.title}
                    </span>
                    <Icon
                      className={
                        active
                          ? 'size-6 text-primary'
                          : 'size-6 text-muted-foreground'
                      }
                    />
                  </button>
                  <div
                    className={
                      active
                        ? 'mt-14 opacity-100 lg:mt-24'
                        : 'pointer-events-none mt-14 opacity-0 lg:mt-24'
                    }
                  >
                    <p className='max-w-md text-lg leading-8 text-background/65'>
                      {audience.copy}
                    </p>
                    <ul className='mt-6 space-y-3'>
                      {audience.points.map((point) => (
                        <li
                          key={point}
                          className='flex gap-3 text-sm text-background/80'
                        >
                          <CheckIcon className='size-4 shrink-0 text-primary' />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className='border-t bg-muted/35'>
          <div className='mx-auto w-full max-w-350 px-4 py-32 sm:px-6 md:py-44 lg:px-8'>
            <div className='grid gap-8 lg:grid-cols-12 lg:items-end'>
              <h2 className='max-w-4xl text-[clamp(2.6rem,5vw,4.75rem)] font-bold leading-[0.96] tracking-tighter lg:col-span-8'>
                Useful research should feel clear from every angle.
              </h2>
              <p className='max-w-md text-lg leading-8 text-muted-foreground lg:col-span-4'>
                A dimensional view of the outcomes BrandRadar supports across
                content, SEO, growth, and brand teams.
              </p>
            </div>
            <div data-scale-visual className='mt-16'>
              <ThreeDimensionalTestimonials />
            </div>
            <p className='mt-5 text-center text-xs leading-5 text-muted-foreground'>
              Representative workflow statements shown for product preview.
              Replace with verified customer quotes before launch.
            </p>
          </div>
        </section>

        <section className='bg-primary text-primary-foreground'>
          <div className='mx-auto flex w-full max-w-350 flex-col items-center px-4 py-32 text-center sm:px-6 md:py-40 lg:px-8'>
            <h2 className='max-w-6xl text-[clamp(2.75rem,6vw,6rem)] font-extrabold leading-[0.94] tracking-[-0.055em]'>
              Stay discoverable—in search, AI, and beyond.
            </h2>
            <p className='mt-7 max-w-2xl text-lg leading-8 text-primary-foreground/70'>
              Create an account and run your first focused keyword or visibility
              report.
            </p>
            <Button
              render={<Link href='/auth/sign-up' />}
              nativeButton={false}
              size='lg'
              className='mt-9 h-12 rounded-[10px] bg-primary-foreground px-6 text-primary hover:bg-primary-foreground/90 active:translate-y-px'
            >
              Start researching free
              <ArrowRightIcon />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
