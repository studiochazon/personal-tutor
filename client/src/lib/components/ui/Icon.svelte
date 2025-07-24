<script lang="ts">
	import {
		Target,
		BookOpen,
		BarChart3,
		Rocket,
		Bot,
		Sparkles,
		ArrowRight,
		Play,
		Users,
		CheckCircle,
		Clock,
		Star,
		Zap,
		GraduationCap,
		Lightbulb,
		TrendingUp,
		Shield,
		Heart,
		Globe,
		Code,
		Palette,
		Music,
		Camera,
		ChevronDown,
		Menu,
		X,
		Search,
		Filter,
		Settings,
		User,
		LogOut,
		Home,
		Plus,
		Edit,
		Trash2,
		Eye,
		EyeOff,
		Mail,
		Lock,
		Calendar,
		MapPin,
		Phone,
		MessageCircle,
		HelpCircle,
		Info,
		AlertCircle,
		AlertTriangle,
		Check,
		X as XIcon
	} from 'lucide-svelte';

	export let name: string;
	export let size: number = 24;
	export let color: string = 'currentColor';
	export let strokeWidth: number = 2;
	export let className: string = '';

	const icons = {
		target: Target,
		book: BookOpen,
		chart: BarChart3,
		rocket: Rocket,
		bot: Bot,
		sparkles: Sparkles,
		arrowRight: ArrowRight,
		play: Play,
		users: Users,
		checkCircle: CheckCircle,
		clock: Clock,
		star: Star,
		zap: Zap,
		graduation: GraduationCap,
		lightbulb: Lightbulb,
		trending: TrendingUp,
		shield: Shield,
		heart: Heart,
		globe: Globe,
		code: Code,
		palette: Palette,
		music: Music,
		camera: Camera,
		chevronDown: ChevronDown,
		menu: Menu,
		x: X,
		search: Search,
		filter: Filter,
		settings: Settings,
		user: User,
		logout: LogOut,
		home: Home,
		plus: Plus,
		edit: Edit,
		trash: Trash2,
		eye: Eye,
		eyeOff: EyeOff,
		mail: Mail,
		lock: Lock,
		calendar: Calendar,
		mapPin: MapPin,
		phone: Phone,
		message: MessageCircle,
		help: HelpCircle,
		info: Info,
		alert: AlertCircle,
		warning: AlertTriangle,
		check: Check,
		close: XIcon
	};

	$: IconComponent = icons[name as keyof typeof icons];
</script>

{#if IconComponent}
	<svelte:component 
		this={IconComponent} 
		size={size} 
		color={color} 
		strokeWidth={strokeWidth}
		class={className}
	/>
{:else}
	<!-- Fallback for unknown icons -->
	<div class="icon-fallback {className}" style="width: {size}px; height: {size}px; color: {color};">
		?
	</div>
{/if}

<style>
	.icon-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-gray-100);
		border-radius: 4px;
		font-weight: bold;
		font-size: 12px;
	}
</style> 