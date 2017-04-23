#
<% copyright.forEach(function(c) { -%>
# <%- c %>
<% }) -%>
#
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

require 'chef/resource'
require 'chef/provider'
require 'poise'


module <%- moduleName %>
  module Resources
    # (see <%- moduleName %>::Resource)
    # @since 1.0.0
    module <%- moduleName %>
      # A `<%- requireName %>` resource to do something.
      #
      # @provides <%- requireName %>
      # @action run
      # @example
      #   <%- requireName %> 'name' do
      #   end
      class Resource < Chef::Resource
        include Poise
        provides(:<%- requireName %>)
        actions(:run)

        # @!attribute something
        #   Something.
        #   @return [String]
        attribute(:something, kind_of: String)

        private

        # Find a default something.
        #
        # @api private
        # @return [String]
        def default_something
        end
      end

      # Provider for `<%- requireName %>`.
      #
      # @see Resource
      # @provides <%- requireName %>
      class Provider < Chef::Provider
        include Poise
        provides(:<%- requireName %>)

        # `run` action for `<%- requireName %>`.
        #
        # @return [void]
        def action_run
          notifying_block do
            do_something
          end
        end

        private

        # Do something.
        #
        # @api private
        # @return [void]
        def do_something
          raise NotImplementedError
        end
      end
    end
  end
end
