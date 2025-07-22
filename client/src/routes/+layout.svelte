<script lang="ts">
	import '../minimal.css';
	import '../styles/design-system.css';
</script>

<header class="header">
	<div class="container">
		<nav class="nav">
			<a href="/" class="nav-brand">
				<!-- <span class="brand-icon">🎓</span> -->
				<span class="brand-text">NovotioAI</span>
			</a>
			<ul class="nav-links">
				<li><a href="/courses" class="nav-link">Courses</a></li>
				<li><a href="/start" class="nav-link">Create Course</a></li>
				<li><a href="/auth/login" class="nav-link">Login</a></li>
				<li><a href="/auth/register" class="nav-link nav-link-primary">Sign Up</a></li>
			</ul>
			<button class="nav-toggle" aria-label="Toggle navigation">
				<span></span>
				<span></span>
				<span></span>
			</button>
		</nav>
	</div>
</header>

<main>
	<slot />
</main>

<footer class="footer">
	<div class="container">
		<div class="footer-content">
			<div class="footer-brand">
				<span class="brand-icon">🎓</span>
				<span class="brand-text">Personal Tutor AI</span>
			</div>
			<div class="footer-links">
				<div class="footer-section">
					<h4>Product</h4>
					<ul>
						<li><a href="/courses">Browse Courses</a></li>
						<li><a href="/start">Create Course</a></li>
						<li><a href="/auth/register">Sign Up</a></li>
					</ul>
				</div>
				<div class="footer-section">
					<h4>Support</h4>
					<ul>
						<li><a href="/help">Help Center</a></li>
						<li><a href="/contact">Contact Us</a></li>
						<li><a href="/docs">Documentation</a></li>
					</ul>
				</div>
				<div class="footer-section">
					<h4>Company</h4>
					<ul>
						<li><a href="/about">About</a></li>
						<li><a href="/privacy">Privacy</a></li>
						<li><a href="/terms">Terms</a></li>
					</ul>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<p>&copy; 2024 Personal Tutor AI. All rights reserved.</p>
		</div>
	</div>
</footer> 