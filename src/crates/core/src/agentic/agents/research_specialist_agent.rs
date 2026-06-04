use super::{Agent, RequestContextPolicy};
use async_trait::async_trait;

pub struct ResearchSpecialistAgent {
    default_tools: Vec<String>,
}

impl Default for ResearchSpecialistAgent {
    fn default() -> Self {
        Self::new()
    }
}

impl ResearchSpecialistAgent {
    pub fn new() -> Self {
        Self {
            default_tools: vec![
                "WebSearch".to_string(),
                "WebFetch".to_string(),
                "Read".to_string(),
            ],
        }
    }
}

#[async_trait]
impl Agent for ResearchSpecialistAgent {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn id(&self) -> &str {
        "ResearchSpecialist"
    }

    fn name(&self) -> &str {
        "Research Specialist"
    }

    fn description(&self) -> &str {
        r#"Read-only subagent for **web research**. Has WebSearch and WebFetch tools. Use to delegate one focused research role (primary sources, news/timeline, expert analysis, counter-evidence, or competitor profile) so multiple roles can run in parallel without polluting the parent context. The specialist runs 3-5 searches, fetches the most relevant pages, and returns a structured markdown report with claim / URL / direct-quote / authority for each finding. The parent agent is responsible for any file writes - specialists return findings via the Task tool result, they do not write to disk."#
    }

    fn prompt_template_name(&self, _model_name: Option<&str>) -> &str {
        "research_specialist_agent"
    }

    fn default_tools(&self) -> Vec<String> {
        self.default_tools.clone()
    }

    fn request_context_policy(&self) -> RequestContextPolicy {
        RequestContextPolicy::empty().with_workspace_instructions()
    }

    fn is_readonly(&self) -> bool {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::{Agent, ResearchSpecialistAgent};

    #[test]
    fn has_web_research_tools() {
        let agent = ResearchSpecialistAgent::new();
        let tools = agent.default_tools();
        assert!(tools.contains(&"WebSearch".to_string()));
        assert!(tools.contains(&"WebFetch".to_string()));
        assert!(tools.contains(&"Read".to_string()));
    }

    #[test]
    fn is_readonly_for_parallel_dispatch() {
        assert!(ResearchSpecialistAgent::new().is_readonly());
    }

    #[test]
    fn always_uses_default_prompt_template() {
        let agent = ResearchSpecialistAgent::new();
        assert_eq!(agent.prompt_template_name(None), "research_specialist_agent");
        assert_eq!(agent.prompt_template_name(Some("gpt-5.1")), "research_specialist_agent");
    }
}
