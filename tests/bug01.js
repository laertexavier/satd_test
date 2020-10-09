class ProjectStatusCommand implements Command {
	public readonly id = '_typescript.projectStatus';

	public constructor(
		private readonly _client: ITypeScriptServiceClient,
		private readonly _delegate: () => ProjectInfoState.State,
	) { }

	public async execute(): Promise<void> {
		const info = this._delegate();


		const result = await vscode.window.showQuickPick<QuickPickItem>(coalesce([
			this.getProjectItem(info),
			this.getVersionItem(),
			this.getHelpItem(),
		]), {
			placeHolder: localize('projectQuickPick.placeholder', "TypeScript Project Info"),
		});

		return result?.run();
	}

	private getVersionItem(): QuickPickItem {
		return {
			label: localize('projectQuickPick.version.label', "Select TypeScript Version..."),
			description: this._client.apiVersion.displayName,
			run: () => {
				this._client.showVersionPicker();
			}
		};
	}

	private getProjectItem(info: ProjectInfoState.State): QuickPickItem | undefined {
		const rootPath = info.type === ProjectInfoState.Type.Resolved ? this._client.getWorkspaceRootForResource(info.resource) : undefined;
		if (!rootPath) {
			return undefined;
		}

		if (info.type === ProjectInfoState.Type.Resolved) {
			if (isImplicitProjectConfigFile(info.configFile)) {
				return {
					label: localize('projectQuickPick.project.create', "Create tsconfig"),
					detail: localize('projectQuickPick.project.create.description', "This file is currently not part of a tsconfig/jsconfig project"),
					run: () => {
						openOrCreateConfig(ProjectType.TypeScript, rootPath, this._client.configuration);
					}
				};
			}
		}

		return {
			label: localize('projectQuickPick.version.goProjectConfig', "Open tsconfig"),
			description: info.type === ProjectInfoState.Type.Resolved ? vscode.workspace.asRelativePath(info.configFile) : undefined,
			run: () => {
				if (info.type === ProjectInfoState.Type.Resolved) {
					openProjectConfigOrPromptToCreate(ProjectType.TypeScript, this._client, rootPath, info.configFile);
				} else if (info.type === ProjectInfoState.Type.Pending) {
					openProjectConfigForFile(ProjectType.TypeScript, this._client, info.resource);
				}
			}
		};
	}

	private getHelpItem(): QuickPickItem {
		return {
			label: localize('projectQuickPick.help', "TypeScript help"),
			run: () => {
				vscode.env.openExternal(vscode.Uri.parse('https://go.microsoft.com/fwlink/?linkid=839919')); // TODO:
			}
		};
	}
}
