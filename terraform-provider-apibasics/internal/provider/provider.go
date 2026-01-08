package provider

import (
	"context"
	"os"

	"github.com/api-basics/terraform-provider-apibasics/internal/client"
	"github.com/hashicorp/terraform-plugin-framework/datasource"
	"github.com/hashicorp/terraform-plugin-framework/provider"
	"github.com/hashicorp/terraform-plugin-framework/provider/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource"
	"github.com/hashicorp/terraform-plugin-framework/types"
)

// Ensure the implementation satisfies the expected interfaces.
var (
	_ provider.Provider = &apibasicsProvider{}
)

// New is a helper function to simplify provider server and testing implementation.
func New(version string) func() provider.Provider {
	return func() provider.Provider {
		return &apibasicsProvider{
			version: version,
		}
	}
}

// apibasicsProvider is the provider implementation.
type apibasicsProvider struct {
	version string
}

// apibasicsProviderModel maps provider schema data to a Go type.
type apibasicsProviderModel struct {
	Endpoint types.String `tfsdk:"endpoint"`
	Email    types.String `tfsdk:"email"`
	Password types.String `tfsdk:"password"`
}

// Metadata returns the provider type name.
func (p *apibasicsProvider) Metadata(_ context.Context, _ provider.MetadataRequest, resp *provider.MetadataResponse) {
	resp.TypeName = "apibasics"
	resp.Version = p.version
}

// Schema defines the provider-level schema for configuration data.
func (p *apibasicsProvider) Schema(_ context.Context, _ provider.SchemaRequest, resp *provider.SchemaResponse) {
	resp.Schema = schema.Schema{
		Description: "Interact with the API Basics service to manage todos via Terraform.",
		Attributes: map[string]schema.Attribute{
			"endpoint": schema.StringAttribute{
				Description: "API endpoint URL. May also be provided via APIBASICS_ENDPOINT environment variable.",
				Optional:    true,
			},
			"email": schema.StringAttribute{
				Description: "Email for authentication. May also be provided via APIBASICS_EMAIL environment variable.",
				Optional:    true,
			},
			"password": schema.StringAttribute{
				Description: "Password for authentication. May also be provided via APIBASICS_PASSWORD environment variable.",
				Optional:    true,
				Sensitive:   true,
			},
		},
	}
}

// Configure prepares the API client for data sources and resources.
func (p *apibasicsProvider) Configure(ctx context.Context, req provider.ConfigureRequest, resp *provider.ConfigureResponse) {
	var config apibasicsProviderModel
	resp.Diagnostics.Append(req.Config.Get(ctx, &config)...)
	if resp.Diagnostics.HasError() {
		return
	}

	// Default values from environment variables
	endpoint := os.Getenv("APIBASICS_ENDPOINT")
	email := os.Getenv("APIBASICS_EMAIL")
	password := os.Getenv("APIBASICS_PASSWORD")

	// Override with explicit configuration
	if !config.Endpoint.IsNull() {
		endpoint = config.Endpoint.ValueString()
	}
	if !config.Email.IsNull() {
		email = config.Email.ValueString()
	}
	if !config.Password.IsNull() {
		password = config.Password.ValueString()
	}

	// Validate required fields
	if endpoint == "" {
		endpoint = "https://api-basics.sharted.workers.dev"
	}

	if email == "" {
		resp.Diagnostics.AddError(
			"Missing Email Configuration",
			"The provider requires an email for authentication. "+
				"Set the email value in the configuration or use the APIBASICS_EMAIL environment variable.",
		)
	}

	if password == "" {
		resp.Diagnostics.AddError(
			"Missing Password Configuration",
			"The provider requires a password for authentication. "+
				"Set the password value in the configuration or use the APIBASICS_PASSWORD environment variable.",
		)
	}

	if resp.Diagnostics.HasError() {
		return
	}

	// Create API client
	apiClient := client.NewClient(endpoint, email, password)

	// Authenticate with the API
	if err := apiClient.Authenticate(); err != nil {
		resp.Diagnostics.AddError(
			"Unable to Authenticate with API",
			"An unexpected error occurred when authenticating with the API. "+
				"Error: "+err.Error(),
		)
		return
	}

	// Make the API client available to resources and data sources
	resp.DataSourceData = apiClient
	resp.ResourceData = apiClient
}

// DataSources defines the data sources implemented in the provider.
func (p *apibasicsProvider) DataSources(_ context.Context) []func() datasource.DataSource {
	return []func() datasource.DataSource{}
}

// Resources defines the resources implemented in the provider.
func (p *apibasicsProvider) Resources(_ context.Context) []func() resource.Resource {
	return []func() resource.Resource{
		NewTodoResource,
	}
}
