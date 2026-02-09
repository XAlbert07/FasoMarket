import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		// Configuration mobile-first des containers
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',      // 16px sur mobile - optimal pour les petits écrans
				sm: '1.5rem',         // 24px sur small screens 
				md: '2rem',           // 32px sur tablettes
				lg: '3rem',           // 48px sur desktop
				xl: '4rem',           // 64px sur grande largeur
			},
			screens: {
				sm: '640px',
				md: '768px', 
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px'
			}
		},
		
		// Breakpoints adaptés aux appareils couramment utilisés au Burkina Faso
		screens: {
			'xs': '375px',        // iPhone SE, petits smartphones
			'sm': '640px',        // Smartphones larges, petites tablettes  
			'md': '768px',        // Tablettes portrait
			'lg': '1024px',       // Tablettes paysage, petits laptops
			'xl': '1280px',       // Desktop standard
			'2xl': '1536px',      // Grands écrans
			
			// Breakpoints spéciaux pour le mobile
			'mobile-sm': '320px', // Très petits smartphones (encore utilisés au BF)
			'mobile-md': '375px', // Smartphones standard
			'mobile-lg': '414px', // Grands smartphones
		},
		
		extend: {
			// Typographie optimisée pour la lecture mobile
			fontFamily: {
				'body': ['IBM Plex Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
				'heading': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
			},
			
			// Tailles de police mobile-first
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
				'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
				'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px - base idéale mobile
				'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
				'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
				'2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
				'5xl': ['3rem', { lineHeight: '1' }],           // 48px
				'6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
				
				// Tailles spéciales mobile
				'mobile-h1': ['1.75rem', { lineHeight: '2rem' }],    // 28px pour titre mobile
				'mobile-h2': ['1.5rem', { lineHeight: '1.875rem' }], // 24px
				'mobile-h3': ['1.25rem', { lineHeight: '1.5rem' }],  // 20px
			},
			
			// Espacements optimisés mobile
			spacing: {
				'mobile-xs': '0.25rem',   // 4px
				'mobile-sm': '0.5rem',    // 8px  
				'mobile-md': '1rem',      // 16px - espacement de base mobile
				'mobile-lg': '1.5rem',    // 24px
				'mobile-xl': '2rem',      // 32px
				'mobile-2xl': '3rem',     // 48px
			},
			
			// Hauteurs adaptées aux éléments tactiles mobiles
			height: {
				'touch': '44px',      // Taille minimale recommandée pour touch
				'touch-lg': '48px',   // Taille confortable pour touch
				'mobile-hero': '60vh', // Hero section mobile
				'tablet-hero': '70vh', // Hero section tablette
			},
			
			// Largeurs pour composants mobiles
			width: {
				'mobile-full': '100%',
				'mobile-card': 'calc(100% - 2rem)',  // Carte avec marge mobile
			},
			
			colors: {
				/* Couleurs nationales du Burkina Faso */
				'bf-red': 'hsl(var(--bf-red))',
				'bf-green': 'hsl(var(--bf-green))',
				'bf-yellow': 'hsl(var(--bf-yellow))',
				
				/* Système de couleurs design */
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				surface: 'hsl(var(--surface))',
				'surface-elevated': 'hsl(var(--surface-elevated))',
				'muted-foreground': 'hsl(var(--muted-foreground))',
				'subtle-text': 'hsl(var(--subtle-text))',
				
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					hover: 'hsl(var(--accent-hover))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					border: 'hsl(var(--card-border))'
				}
			},
			
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				// Bordures adaptées au mobile
				'mobile': '0.5rem',      // 8px - plus doux pour mobile
				'mobile-lg': '0.75rem',  // 12px
				'mobile-xl': '1rem',     // 16px
			},
			
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'primary': 'var(--shadow-primary)',
				
				// Ombres légères pour mobile (moins gourmandes)
				'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
				'mobile-lg': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
			},
			
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-surface': 'var(--gradient-surface)',
			},
			
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				
				// Animation douce pour mobile (économise la batterie)
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)' },
					'100%': { transform: 'translateY(0)' }
				}
			},
			
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
