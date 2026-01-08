package provider

import (
	"context"
	"fmt"

	"github.com/api-basics/terraform-provider-apibasics/internal/client"
	"github.com/hashicorp/terraform-plugin-framework/path"
	"github.com/hashicorp/terraform-plugin-framework/resource"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/booldefault"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/planmodifier"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/stringdefault"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/stringplanmodifier"
	"github.com/hashicorp/terraform-plugin-framework/types"
	"github.com/hashicorp/terraform-plugin-log/tflog"
)

// Ensure the implementation satisfies the expected interfaces.
var (
	_ resource.Resource                = &todoResource{}
	_ resource.ResourceWithConfigure   = &todoResource{}
	_ resource.ResourceWithImportState = &todoResource{}
)

// NewTodoResource is a helper function to simplify the provider implementation.
func NewTodoResource() resource.Resource {
	return &todoResource{}
}

// todoResource is the resource implementation.
type todoResource struct {
	client *client.Client
}

// todoResourceModel maps the resource schema data.
type todoResourceModel struct {
	ID          types.String `tfsdk:"id"`
	Title       types.String `tfsdk:"title"`
	Description types.String `tfsdk:"description"`
	Completed   types.Bool   `tfsdk:"completed"`
	UserID      types.String `tfsdk:"user_id"`
	CreatedAt   types.String `tfsdk:"created_at"`
	UpdatedAt   types.String `tfsdk:"updated_at"`
}

// Metadata returns the resource type name.
func (r *todoResource) Metadata(_ context.Context, req resource.MetadataRequest, resp *resource.MetadataResponse) {
	resp.TypeName = req.ProviderTypeName + "_todo"
}

// Schema defines the schema for the resource.
func (r *todoResource) Schema(_ context.Context, _ resource.SchemaRequest, resp *resource.SchemaResponse) {
	resp.Schema = schema.Schema{
		Description: "Manages a todo item in the API Basics service.",
		Attributes: map[string]schema.Attribute{
			"id": schema.StringAttribute{
				Description: "UUID of the todo.",
				Computed:    true,
				PlanModifiers: []planmodifier.String{
					stringplanmodifier.UseStateForUnknown(),
				},
			},
			"title": schema.StringAttribute{
				Description: "Title of the todo.",
				Required:    true,
			},
			"description": schema.StringAttribute{
				Description: "Description of the todo.",
				Optional:    true,
				Computed:    true,
				Default:     stringdefault.StaticString(""),
			},
			"completed": schema.BoolAttribute{
				Description: "Whether the todo is completed.",
				Optional:    true,
				Computed:    true,
				Default:     booldefault.StaticBool(false),
			},
			"user_id": schema.StringAttribute{
				Description: "UUID of the user who owns this todo.",
				Computed:    true,
			},
			"created_at": schema.StringAttribute{
				Description: "Timestamp when the todo was created.",
				Computed:    true,
			},
			"updated_at": schema.StringAttribute{
				Description: "Timestamp when the todo was last updated.",
				Computed:    true,
			},
		},
	}
}

// Configure adds the provider configured client to the resource.
func (r *todoResource) Configure(_ context.Context, req resource.ConfigureRequest, resp *resource.ConfigureResponse) {
	if req.ProviderData == nil {
		return
	}

	client, ok := req.ProviderData.(*client.Client)
	if !ok {
		resp.Diagnostics.AddError(
			"Unexpected Resource Configure Type",
			fmt.Sprintf("Expected *client.Client, got: %T. Please report this issue to the provider developers.", req.ProviderData),
		)
		return
	}

	r.client = client
}

// Create creates the resource and sets the initial Terraform state.
func (r *todoResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
	// Retrieve values from plan
	var plan todoResourceModel
	diags := req.Plan.Get(ctx, &plan)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	// Generate API request body from plan
	title := plan.Title.ValueString()
	description := plan.Description.ValueString()
	completed := plan.Completed.ValueBool()

	// Create new todo via API
	todo, err := r.client.CreateTodo(title, description, completed)
	if err != nil {
		resp.Diagnostics.AddError(
			"Error Creating Todo",
			"Could not create todo, unexpected error: "+err.Error(),
		)
		return
	}

	// Map response body to schema and populate computed attribute values
	plan.ID = types.StringValue(todo.ID)
	plan.Title = types.StringValue(todo.Title)
	plan.Description = types.StringValue(todo.Description)
	plan.Completed = types.BoolValue(todo.Completed)
	plan.UserID = types.StringValue(todo.UserID)
	plan.CreatedAt = types.StringValue(todo.CreatedAt)
	plan.UpdatedAt = types.StringValue(todo.UpdatedAt)

	// Set state to fully populated data
	diags = resp.State.Set(ctx, plan)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	tflog.Info(ctx, "Created todo", map[string]any{"id": todo.ID})
}

// Read refreshes the Terraform state with the latest data.
func (r *todoResource) Read(ctx context.Context, req resource.ReadRequest, resp *resource.ReadResponse) {
	// Get current state
	var state todoResourceModel
	diags := req.State.Get(ctx, &state)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	// Get refreshed todo from API
	todo, err := r.client.GetTodo(state.ID.ValueString())
	if err != nil {
		// If the resource no longer exists, remove it from state
		if err.Error() == "todo not found" {
			resp.State.RemoveResource(ctx)
			return
		}

		resp.Diagnostics.AddError(
			"Error Reading Todo",
			"Could not read todo ID "+state.ID.ValueString()+": "+err.Error(),
		)
		return
	}

	// Overwrite items with refreshed state
	state.Title = types.StringValue(todo.Title)
	state.Description = types.StringValue(todo.Description)
	state.Completed = types.BoolValue(todo.Completed)
	state.UserID = types.StringValue(todo.UserID)
	state.CreatedAt = types.StringValue(todo.CreatedAt)
	state.UpdatedAt = types.StringValue(todo.UpdatedAt)

	// Set refreshed state
	diags = resp.State.Set(ctx, &state)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	tflog.Info(ctx, "Read todo", map[string]any{"id": todo.ID})
}

// Update updates the resource and sets the updated Terraform state on success.
func (r *todoResource) Update(ctx context.Context, req resource.UpdateRequest, resp *resource.UpdateResponse) {
	// Retrieve values from plan
	var plan todoResourceModel
	diags := req.Plan.Get(ctx, &plan)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	// Get current state
	var state todoResourceModel
	diags = req.State.Get(ctx, &state)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	// Update existing todo via API
	title := plan.Title.ValueString()
	description := plan.Description.ValueString()
	completed := plan.Completed.ValueBool()

	todo, err := r.client.UpdateTodo(
		state.ID.ValueString(),
		&title,
		&description,
		&completed,
	)
	if err != nil {
		resp.Diagnostics.AddError(
			"Error Updating Todo",
			"Could not update todo, unexpected error: "+err.Error(),
		)
		return
	}

	// Update resource state with updated values
	plan.ID = types.StringValue(todo.ID)
	plan.Title = types.StringValue(todo.Title)
	plan.Description = types.StringValue(todo.Description)
	plan.Completed = types.BoolValue(todo.Completed)
	plan.UserID = types.StringValue(todo.UserID)
	plan.CreatedAt = types.StringValue(todo.CreatedAt)
	plan.UpdatedAt = types.StringValue(todo.UpdatedAt)

	diags = resp.State.Set(ctx, plan)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	tflog.Info(ctx, "Updated todo", map[string]any{"id": todo.ID})
}

// Delete deletes the resource and removes the Terraform state on success.
func (r *todoResource) Delete(ctx context.Context, req resource.DeleteRequest, resp *resource.DeleteResponse) {
	// Retrieve values from state
	var state todoResourceModel
	diags := req.State.Get(ctx, &state)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	// Delete existing todo via API
	err := r.client.DeleteTodo(state.ID.ValueString())
	if err != nil {
		resp.Diagnostics.AddError(
			"Error Deleting Todo",
			"Could not delete todo, unexpected error: "+err.Error(),
		)
		return
	}

	tflog.Info(ctx, "Deleted todo", map[string]any{"id": state.ID.ValueString()})
}

// ImportState imports the resource into Terraform state.
func (r *todoResource) ImportState(ctx context.Context, req resource.ImportStateRequest, resp *resource.ImportStateResponse) {
	// Retrieve import ID and save to id attribute
	resource.ImportStatePassthroughID(ctx, path.Root("id"), req, resp)
}
