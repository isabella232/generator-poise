# <%- displayName %> Cookbook

[![Build Status](https://img.shields.io/travis/poise/<%- cookbookName %>.svg)](https://travis-ci.org/poise/<%- cookbookName %>)
[![Gem Version](https://img.shields.io/gem/v/<%- cookbookName %>.svg)](https://rubygems.org/gems/<%- cookbookName %>)
[![Cookbook Version](https://img.shields.io/cookbook/v/<%- cookbookName %>.svg)](https://supermarket.chef.io/cookbooks/<%- cookbookName %>)
[![Coverage](https://img.shields.io/codecov/c/github/poise/<%- cookbookName %>.svg)](https://codecov.io/github/poise/<%- cookbookName %>)
[![Gemnasium](https://img.shields.io/gemnasium/poise/<%- cookbookName %>.svg)](https://gemnasium.com/poise/<%- cookbookName %>)
[![License](https://img.shields.io/badge/license-Apache_2-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

A [Chef](https://www.chef.io/) cookbook to do something.

## Quick Start

TODO.

## Recipes

* `<%- cookbookName %>::default` – Do something.

## Attributes

* `node['<%- cookbookName %>']['something']` – Something.

## Resources

### `<%- requireName %>`

The `<%- requireName %>` resource installs and configures Monit.

```ruby
<%- requireName %> '<%- requireName %>' do
  something value
end
```

#### Actions

* `:something` – Something. *(default)*

#### Properties

* `something` – Something. *(name attribute)*

## Sponsors

Development sponsored by [SAP](https://www.sap.com/).

The Poise test server infrastructure is sponsored by [Rackspace](https://rackspace.com/).

## License

<% copyright.forEach(function(c) { -%>
<%- c %>
<% }) -%>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
