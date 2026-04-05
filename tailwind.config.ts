
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./src/**/*.{ts,tsx}",
		"./index.html"
	],
	prefix: "",
	safelist: [
		// Only truly dynamic classes - animation utilities
		'animate-pulse-glow',
	],
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '100%'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))',
    				light: 'hsl(var(--primary-light))',
    				dark: 'hsl(var(--primary-dark))'
    			},
    			monarch: 'hsl(var(--primary))',
    			'edge-light': 'hsl(var(--border))',
    			'edge-dark': 'hsl(var(--border))',
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			success: {
    				DEFAULT: 'hsl(var(--success))',
    				foreground: 'hsl(var(--success-foreground))'
    			},
    			warning: {
    				DEFAULT: 'hsl(var(--warning))',
    				foreground: 'hsl(var(--warning-foreground))'
    			},
    			error: {
    				DEFAULT: 'hsl(var(--error))',
    				foreground: 'hsl(var(--error-foreground))'
    			},
    			info: {
    				DEFAULT: 'hsl(var(--info))',
    				foreground: 'hsl(var(--info-foreground))'
    			},
    			overlay: {
    				DEFAULT: 'hsl(var(--overlay-foreground))',
    				foreground: 'hsl(var(--overlay-foreground))',
    				muted: 'hsl(var(--overlay-muted))'
    			},
    			feature: {
    				info: 'hsl(var(--feature-info))',
    				'info-dark': 'hsl(var(--feature-info-dark))',
    				success: 'hsl(var(--feature-success))',
    				'success-dark': 'hsl(var(--feature-success-dark))',
    				accent: 'hsl(var(--feature-accent))',
    				'accent-dark': 'hsl(var(--feature-accent-dark))',
    				warning: 'hsl(var(--feature-warning))',
    				'warning-dark': 'hsl(var(--feature-warning-dark))',
    				danger: 'hsl(var(--feature-danger))',
    				'danger-dark': 'hsl(var(--feature-danger-dark))',
    				violet: 'hsl(var(--feature-violet))',
    				'violet-dark': 'hsl(var(--feature-violet-dark))',
    				rose: 'hsl(var(--feature-rose))',
    				'rose-dark': 'hsl(var(--feature-rose-dark))',
    				cyan: 'hsl(var(--feature-cyan))',
    				'cyan-dark': 'hsl(var(--feature-cyan-dark))',
    				sky: 'hsl(var(--feature-sky))',
    				'sky-dark': 'hsl(var(--feature-sky-dark))',
    				teal: 'hsl(var(--feature-teal))',
    				'teal-dark': 'hsl(var(--feature-teal-dark))'
    			},
    			teal: {
    				DEFAULT: 'hsl(175 35% 35%)',
    				light: 'hsl(175 35% 45%)',
    				dark: 'hsl(175 35% 25%)',
    				foreground: 'hsl(0 0% 98%)'
    			},
    			sky: {
    				DEFAULT: 'hsl(200 60% 60%)',
    				light: 'hsl(200 60% 70%)',
    				dark: 'hsl(200 60% 50%)'
    			},
    			earth: {
    				DEFAULT: 'hsl(25 50% 50%)',
    				light: 'hsl(25 50% 60%)',
    				dark: 'hsl(25 50% 40%)'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		backgroundImage: {
    			'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-dark)))',
    			'gradient-primary-radial': 'radial-gradient(circle, hsl(var(--primary-light)), hsl(var(--primary)))',
    			'gradient-secondary': 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--muted)))',
    			'gradient-subtle': 'linear-gradient(180deg, hsl(var(--background)), hsl(var(--muted)))'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'fade-in': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(10px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'fade-in-right': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateX(20px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateX(0)'
    				}
    			},
    			'fade-in-left': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateX(-20px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateX(0)'
    				}
    			},
    			'slide-up': {
    				'0%': {
    					transform: 'translateY(100%)'
    				},
    				'100%': {
    					transform: 'translateY(0)'
    				}
    			},
    			'slide-down': {
    				'0%': {
    					transform: 'translateY(-100%)'
    				},
    				'100%': {
    					transform: 'translateY(0)'
    				}
    			},
    			float: {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-10px)'
    				}
    			},
    			'pulse-slow': {
    				'0%, 100%': {
    					opacity: '1'
    				},
    				'50%': {
    					opacity: '0.8'
    				}
    			},
    			wave: {
    				'0%': {
    					transform: 'translateX(0) translateZ(0) scaleY(1)'
    				},
    				'50%': {
    					transform: 'translateX(-25%) translateZ(0) scaleY(0.8)'
    				},
    				'100%': {
    					transform: 'translateX(-50%) translateZ(0) scaleY(1)'
    				}
    			},
    			// Phase 6: Animation polish keyframes
    			'subtle-bounce': {
    				'0%, 100%': { transform: 'translateY(0)' },
    				'50%': { transform: 'translateY(-4px)' }
    			},
    			'micro-lift': {
    				'0%': { transform: 'translateY(0)' },
    				'100%': { transform: 'translateY(-2px)' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'fade-in': 'fade-in 0.6s ease-out',
    			'fade-in-right': 'fade-in-right 0.6s ease-out',
    			'fade-in-left': 'fade-in-left 0.6s ease-out',
    			'slide-up': 'slide-up 0.6s ease-out',
    			'slide-down': 'slide-down 0.6s ease-out',
    			float: 'float 6s ease-in-out infinite',
    			'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
    			'scale-in': 'scale-in 0.3s ease-out',
    			'slide-in-up': 'slide-in-up 0.4s ease-out',
    			'slide-in-right': 'slide-in-right 0.4s ease-out',
    			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
    			'golden-shimmer': 'golden-shimmer 1.5s ease-in-out infinite',
    			// Phase 6: New animation polish utilities
    			'subtle-bounce': 'subtle-bounce 2s ease-in-out infinite',
    			'skeleton-shimmer': 'skeleton-shimmer 1.5s ease-in-out infinite',
    			'micro-lift': 'micro-lift 0.2s ease-out forwards'
    		},
    		transitionDuration: {
    			fast: '150ms',
    			normal: '300ms',
    			slow: '500ms',
    			slower: '700ms'
    		},
    		transitionTimingFunction: {
    			'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    		},
    		boxShadow: {
    			'2xs': 'var(--shadow-2xs)',
    			xs: 'var(--shadow-xs)',
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
    		},
    		fontFamily: {
    			sans: [
    				'Inter',
    				'ui-sans-serif',
    				'system-ui',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'Segoe UI',
    				'sans-serif'
    			],
    			serif: [
    				'Playfair Display',
    				'Georgia',
    				'Cambria',
    				'Times New Roman',
    				'serif'
    			],
    			mono: [
    				'JetBrains Mono',
    				'Monaco',
    				'Consolas',
    				'Courier New',
    				'monospace'
    			]
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
