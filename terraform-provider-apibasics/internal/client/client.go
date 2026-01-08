package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client manages communication with the API Basics API
type Client struct {
	BaseURL      string
	Email        string
	Password     string
	AccessToken  string
	RefreshToken string
	HTTPClient   *http.Client
}

// NewClient creates a new API client
func NewClient(baseURL, email, password string) *Client {
	return &Client{
		BaseURL:  baseURL,
		Email:    email,
		Password: password,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// TokenResponse represents the OAuth token response
type TokenResponse struct {
	TokenType    string `json:"token_type"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

// Authenticate logs in and retrieves access tokens
func (c *Client) Authenticate() error {
	loginData := map[string]string{
		"email":    c.Email,
		"password": c.Password,
	}

	body, err := json.Marshal(loginData)
	if err != nil {
		return fmt.Errorf("failed to marshal login data: %w", err)
	}

	req, err := http.NewRequest("POST", c.BaseURL+"/token", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create auth request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("auth request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("authentication failed (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read auth response: %w", err)
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(respBody, &tokenResp); err != nil {
		return fmt.Errorf("failed to parse auth response: %w", err)
	}

	c.AccessToken = tokenResp.AccessToken
	c.RefreshToken = tokenResp.RefreshToken

	return nil
}

// DoRequest makes an authenticated HTTP request
func (c *Client) DoRequest(method, path string, body interface{}) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, c.BaseURL+path, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.AccessToken)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	// Handle 401 - try to re-authenticate
	if resp.StatusCode == http.StatusUnauthorized {
		resp.Body.Close()
		if err := c.Authenticate(); err != nil {
			return nil, fmt.Errorf("re-authentication failed: %w", err)
		}
		// Retry the request
		return c.DoRequest(method, path, body)
	}

	return resp, nil
}

// Todo represents a todo item
type Todo struct {
	ID          string `json:"id,omitempty"`
	UserID      string `json:"userId,omitempty"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Completed   bool   `json:"completed"`
	CreatedAt   string `json:"createdAt,omitempty"`
	UpdatedAt   string `json:"updatedAt,omitempty"`
}

// CreateTodo creates a new todo
func (c *Client) CreateTodo(title, description string, completed bool) (*Todo, error) {
	todo := map[string]interface{}{
		"title":       title,
		"description": description,
		"completed":   completed,
	}

	resp, err := c.DoRequest("POST", "/todos", todo)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("create todo failed (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var createdTodo Todo
	if err := json.NewDecoder(resp.Body).Decode(&createdTodo); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &createdTodo, nil
}

// GetTodo retrieves a todo by ID
func (c *Client) GetTodo(id string) (*Todo, error) {
	resp, err := c.DoRequest("GET", "/todos/"+id, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("todo not found")
	}

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("get todo failed (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var todo Todo
	if err := json.NewDecoder(resp.Body).Decode(&todo); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &todo, nil
}

// UpdateTodo updates a todo
func (c *Client) UpdateTodo(id string, title, description *string, completed *bool) (*Todo, error) {
	updates := make(map[string]interface{})
	if title != nil {
		updates["title"] = *title
	}
	if description != nil {
		updates["description"] = *description
	}
	if completed != nil {
		updates["completed"] = *completed
	}

	resp, err := c.DoRequest("PUT", "/todos/"+id, updates)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("update todo failed (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var updatedTodo Todo
	if err := json.NewDecoder(resp.Body).Decode(&updatedTodo); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &updatedTodo, nil
}

// DeleteTodo deletes a todo
func (c *Client) DeleteTodo(id string) error {
	resp, err := c.DoRequest("DELETE", "/todos/"+id, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		// Already deleted - idempotent
		return nil
	}

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete todo failed (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}
