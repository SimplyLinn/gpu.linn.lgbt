import os
from pathlib import Path
from typing import List, Optional, Union
from huggingface_hub.file_download import REGEX_COMMIT_HASH, repo_folder_name
from huggingface_hub.constants import DEFAULT_REVISION, REPO_TYPES, HUGGINGFACE_HUB_CACHE
from huggingface_hub.utils import filter_repo_objects
from huggingface_hub.hf_api import HfApi, HfFolder

def checkHasFile(
    repo_id: str,
    filename: str,
    *,
    subfolder: Optional[str] = None,
    repo_type: Optional[str] = None,
    revision: Optional[str] = None,
    cache_dir: Union[str, Path, None] = None,
    force_download: Optional[bool] = False,
):
    if force_download:
        return False
    if cache_dir is None:
        cache_dir = HUGGINGFACE_HUB_CACHE
    if revision is None:
        revision = DEFAULT_REVISION
    if isinstance(cache_dir, Path):
        cache_dir = str(cache_dir)

    if subfolder is not None:
        # This is used to create a URL, and not a local path, hence the forward slash.
        filename = f"{subfolder}/{filename}"

    if repo_type is None:
        repo_type = "model"
    if repo_type not in REPO_TYPES:
        raise ValueError(
            f"Invalid repo type: {repo_type}. Accepted repo types are:"
            f" {str(REPO_TYPES)}"
        )

    storage_folder = os.path.join(
        cache_dir, repo_folder_name(repo_id=repo_id, repo_type=repo_type)
    )
    if not os.path.exists(storage_folder):
        return False

    # cross platform transcription of filename, to be used as a local file path.
    relative_filename = os.path.join(*filename.split("/"))

    # if user provides a commit_hash and they already have the file on disk,
    # shortcut everything.
    if REGEX_COMMIT_HASH.match(revision):
        pointer_path = os.path.join(
            storage_folder, "snapshots", revision, relative_filename
        )
        if os.path.exists(pointer_path):
            return True

    commit_hash = None

    if REGEX_COMMIT_HASH.match(revision):
        commit_hash = revision
    else:
        ref_path = os.path.join(storage_folder, "refs", revision)
        with open(ref_path) as f:
            commit_hash = f.read()

    pointer_path = os.path.join(
        storage_folder, "snapshots", commit_hash, relative_filename
    )

    return os.path.exists(pointer_path)




def getExistingPretrainedPathIfExisting(
    repo_id: str,
    *,
    revision: Optional[str] = None,
    repo_type: Optional[str] = None,
    cache_dir: Union[str, Path, None] = None,
    use_auth_token: Optional[Union[bool, str]] = None,
    local_files_only: Optional[bool] = False,
    allow_regex: Optional[Union[List[str], str]] = None,
    ignore_regex: Optional[Union[List[str], str]] = None,
    allow_patterns: Optional[Union[List[str], str]] = None,
    ignore_patterns: Optional[Union[List[str], str]] = None,
):
    if cache_dir is None:
        cache_dir = HUGGINGFACE_HUB_CACHE
    if revision is None:
        revision = DEFAULT_REVISION
    if isinstance(cache_dir, Path):
        cache_dir = str(cache_dir)

    if isinstance(use_auth_token, str):
        token = use_auth_token
    elif use_auth_token:
        token = HfFolder.get_token()
        if token is None:
            raise EnvironmentError(
                "You specified use_auth_token=True, but a Hugging Face token was not"
                " found."
            )
    else:
        token = None

    if repo_type is None:
        repo_type = "model"
    if repo_type not in REPO_TYPES:
        raise ValueError(
            f"Invalid repo type: {repo_type}. Accepted repo types are:"
            f" {str(REPO_TYPES)}"
        )

    storage_folder = os.path.join(
        cache_dir, repo_folder_name(repo_id=repo_id, repo_type=repo_type)
    )

    # TODO: remove these 4 lines in version 0.12
    #       Deprecated code to ensure backward compatibility.
    if allow_regex is not None:
        allow_patterns = allow_regex
    if ignore_regex is not None:
        ignore_patterns = ignore_regex

    # if we have no internet connection we will look for an
    # appropriate folder in the cache
    # If the specified revision is a commit hash, look inside "snapshots".
    # If the specified revision is a branch or tag, look inside "refs".
    if local_files_only:
        print(storage_folder, "refs", revision)
        if REGEX_COMMIT_HASH.match(revision):
            commit_hash = revision
        else:
            # retrieve commit_hash from file
            ref_path = os.path.join(storage_folder, "refs", revision)
            with open(ref_path) as f:
                commit_hash = f.read()

        snapshot_folder = os.path.join(storage_folder, "snapshots", commit_hash)

        if os.path.exists(snapshot_folder):
            return snapshot_folder

        raise ValueError(
            "Cannot find an appropriate cached snapshot folder for the specified"
            " revision on the local disk and outgoing traffic has been disabled. To"
            " enable repo look-ups and downloads online, set 'local_files_only' to"
            " False."
        )

    # if we have internet connection we retrieve the correct folder name from the huggingface api
    _api = HfApi()
    repo_info = _api.repo_info(
        repo_id=repo_id, repo_type=repo_type, revision=revision, token=token
    )
    filtered_repo_files = filter_repo_objects(
        items=[f.rfilename for f in repo_info.siblings],
        allow_patterns=allow_patterns,
        ignore_patterns=ignore_patterns,
    )
    commit_hash = repo_info.sha
    snapshot_folder = os.path.join(storage_folder, "snapshots", commit_hash)
    # if passed revision is not identical to commit_hash
    # then revision has to be a branch name or tag name.
    # In that case store a ref.
    if revision != commit_hash:
        ref_path = os.path.join(storage_folder, "refs", revision)

    for repo_file in filtered_repo_files:
        if not checkHasFile(
            repo_id,
            filename=repo_file,
            repo_type = repo_type,
            revision=commit_hash,
            cache_dir=cache_dir,
        ):
            return False
    return snapshot_folder