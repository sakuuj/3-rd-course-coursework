package by.bsu.fpmi.apigateway.config;import by.bsu.fpmi.apigateway.security.JwtAuthenticationConverter;import by.bsu.fpmi.apigateway.security.JwtAuthenticationProvider;import by.bsu.fpmi.apigateway.security.ParameterAuthenticationConverter;import by.bsu.fpmi.apigateway.security.ParameterAuthenticationLoginFilter;import by.bsu.fpmi.apigateway.security.ParameterAuthenticationProvider;import org.springframework.beans.factory.annotation.Qualifier;import org.springframework.context.annotation.Bean;import org.springframework.context.annotation.Configuration;import org.springframework.http.HttpHeaders;import org.springframework.http.HttpMethod;import org.springframework.security.authentication.AuthenticationManager;import org.springframework.security.authentication.ProviderManager;import org.springframework.security.config.annotation.web.builders.HttpSecurity;import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;import org.springframework.security.web.SecurityFilterChain;import org.springframework.security.web.authentication.AuthenticationFilter;import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;import org.springframework.security.web.util.matcher.AntPathRequestMatcher;import org.springframework.security.web.util.matcher.RegexRequestMatcher;import org.springframework.web.cors.CorsConfiguration;import java.util.List;import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;import static org.springframework.security.web.util.matcher.RegexRequestMatcher.regexMatcher;@Configuration(proxyBeanMethods = false)@EnableWebSecuritypublic class SecurityConfig {    @Bean    AuthenticationManager authenticationManager(ParameterAuthenticationProvider paramAuthenticationProvider,                                                JwtAuthenticationProvider jwtAuthenticationProvider) {        return new ProviderManager(paramAuthenticationProvider, jwtAuthenticationProvider);    }    @Bean    @Qualifier("jwtAuthenticationFilter")    AuthenticationFilter jwtAuthenticationFilter(AuthenticationManager authenticationManager,                                                 JwtAuthenticationConverter jwtAuthConverter) throws Exception {        var authFilter = new AuthenticationFilter(authenticationManager, jwtAuthConverter);        authFilter.setSuccessHandler((request, response, authentication) -> {        });        return authFilter;    }    @Bean    @Qualifier("parameterAuthenticationFilter")    AuthenticationFilter parameterAuthenticationFilter(AuthenticationManager authenticationManager,                                                       ParameterAuthenticationConverter paramAuthConverter    ) throws Exception {        var paramAuthenticationFilter = new AuthenticationFilter(authenticationManager, paramAuthConverter);        paramAuthenticationFilter.setRequestMatcher(new AntPathRequestMatcher("/login", HttpMethod.POST.name()));        paramAuthenticationFilter.setSuccessHandler((request, response, chain) -> {            request.setAttribute(ParameterAuthenticationLoginFilter.ON_LOGIN_ATTRIBUTE, "loggedIn");        });        return paramAuthenticationFilter;    }    @Bean    SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity,                                            @Qualifier("jwtAuthenticationFilter") AuthenticationFilter jwtAuthFilter,                                            JwtAuthenticationProvider jwtAuthenticationProvider,                                            @Qualifier("parameterAuthenticationFilter") AuthenticationFilter paramAuthFilter,                                            ParameterAuthenticationProvider paramAuthProvider,                                            ParameterAuthenticationLoginFilter parameterAuthenticationLoginFilter) throws Exception {        return httpSecurity                .cors(c -> c.configurationSource(request -> {                            CorsConfiguration corsConfiguration = new CorsConfiguration();                            corsConfiguration.setAllowedMethods(List.of("POST", "GET"));                            corsConfiguration.setAllowedOriginPatterns(List.of("http://localhost:3000"));                            corsConfiguration.setAllowCredentials(true);                            corsConfiguration.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE));                            return corsConfiguration;                        })                )                .sessionManagement(AbstractHttpConfigurer::disable)                .csrf(AbstractHttpConfigurer::disable)                .authenticationProvider(jwtAuthenticationProvider)                .addFilterBefore(jwtAuthFilter, BasicAuthenticationFilter.class)                .authenticationProvider(paramAuthProvider)                .addFilterAt(paramAuthFilter, BasicAuthenticationFilter.class)                .addFilterAfter(parameterAuthenticationLoginFilter, BasicAuthenticationFilter.class)                .authorizeHttpRequests(configurer -> configurer                        .requestMatchers(                                antMatcher("/"),                                regexMatcher("/index.html"),                                regexMatcher("/register"),                                regexMatcher("/static/.*")                        )                        .permitAll()                        .anyRequest().authenticated())                .build();    }}