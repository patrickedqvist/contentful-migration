# Contentful Migration
__based on https://github.com/contentful-userland/contentful-action__

This action is for automating contentful migrations.

## Inputs

## `space_id`

**Required** The ID of the contentful space you want to apply the migrations to

## `management_api_key`

**Required** The management-api key for contentful

## Outputs

## `environment_url`

The url to the new contentful environment URL

## `environment_name`

The name of the new Contentful environment

## Example usage

```yml
- name: Contentful Migration
    id: migration
    uses: patrickedqvist/contentful-migration
    env:
        space_id: ${{ secrets.CONTENTFUL_SPACE_ID }}
        management_api_key: ${{ secrets.CONTENTFUL_MANAGEMENT_API_KEY }}
        # contentful_alias: "master"
        # master_pattern: "main-[YY]-[MM]-[DD]-[hh]-[mm]"
        # feature_pattern: "GH-[branch]"
        # version_field: "version"
        # version_content_type: "versionTracking"
        # migrations_dir: "migrations"
        # delete_feature: "true"
        # set_alias: "true"
        # verbose: "true"
        # delay: "5000"
        # max_number_of_tries: "10"
```