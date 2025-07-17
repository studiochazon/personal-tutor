<script lang="ts">
	import '../app.css';
</script>

<header class="container">
	<nav class="nav">
		<a href="/" class="nav-brand">Personal Tutor AI</a>
		<ul class="nav-links">
			<li><a href="/courses" class="nav-link">Courses</a></li>
			<li><a href="/auth/login" class="nav-link">Login</a></li>
			<li><a href="/auth/register" class="nav-link">Sign Up</a></li>
		</ul>
	</nav>
</header>

<main>
	<slot />
</main>

<footer class="bg-gray-800 text-white py-8 mt-20">
	<div class="container text-center">
		<p>&copy; 2024 Personal Tutor AI. All rights reserved.</p>
	</div>
</footer> 